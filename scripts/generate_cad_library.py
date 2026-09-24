"""Generate 3D CAD meshes (STL & GLB) and preview renders for the SolidWorks library jobs.

Generates:
1. part-2.stl (Stepped T-Block)
2. job-flange-connector.stl (Flanged Slotted Bearing Support)
3. job-kelas-extrim.stl (Complex Bracket Plate with Ribs and Bosses)

Uses standard library + Pillow (math, struct, json, pathlib).
"""

from __future__ import annotations

import json
import math
import struct
from dataclasses import dataclass, field
from pathlib import Path
from typing import Iterable

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUTPUT_DIR = ROOT / "public" / "models" / "solidworks-library"

Vector = tuple[float, float, float]
Face = tuple[int, int, int]


@dataclass
class Mesh:
    vertices: list[Vector] = field(default_factory=list)
    faces: list[Face] = field(default_factory=list)

    def add(self, other: "Mesh") -> None:
        offset = len(self.vertices)
        self.vertices.extend(other.vertices)
        self.faces.extend((a + offset, b + offset, c + offset) for a, b, c in other.faces)


def add_quad(faces: list[Face], a: int, b: int, c: int, d: int) -> None:
    faces.extend(((a, b, c), (a, c, d)))


def make_box(x0: float, x1: float, y0: float, y1: float, z0: float, z1: float) -> Mesh:
    vertices = [
        (x0, y0, z0), (x1, y0, z0), (x1, y1, z0), (x0, y1, z0),
        (x0, y0, z1), (x1, y0, z1), (x1, y1, z1), (x0, y1, z1),
    ]
    faces: list[Face] = []
    add_quad(faces, 0, 3, 2, 1)  # Bottom (Z0)
    add_quad(faces, 4, 5, 6, 7)  # Top (Z1)
    add_quad(faces, 0, 1, 5, 4)  # Front (Y0)
    add_quad(faces, 1, 2, 6, 5)  # Right (X1)
    add_quad(faces, 2, 3, 7, 6)  # Back (Y1)
    add_quad(faces, 3, 0, 4, 7)  # Left (X0)
    return Mesh(vertices, faces)


def make_solid_cylinder_z(
    cx: float,
    cy: float,
    z0: float,
    z1: float,
    radius: float,
    segments: int = 96,
) -> Mesh:
    vertices: list[Vector] = []
    bc_idx = 0
    tc_idx = 1
    vertices.append((cx, cy, z0))
    vertices.append((cx, cy, z1))

    bottom_ring_start = 2
    top_ring_start = 2 + segments

    for i in range(segments):
        angle = (i / segments) * math.tau
        vx = cx + radius * math.cos(angle)
        vy = cy + radius * math.sin(angle)
        vertices.append((vx, vy, z0))

    for i in range(segments):
        angle = (i / segments) * math.tau
        vx = cx + radius * math.cos(angle)
        vy = cy + radius * math.sin(angle)
        vertices.append((vx, vy, z1))

    faces: list[Face] = []
    for i in range(segments):
        nxt = (i + 1) % segments
        faces.append((bc_idx, bottom_ring_start + nxt, bottom_ring_start + i))
        faces.append((tc_idx, top_ring_start + i, top_ring_start + nxt))
        add_quad(
            faces,
            bottom_ring_start + i,
            bottom_ring_start + nxt,
            top_ring_start + nxt,
            top_ring_start + i,
        )

    return Mesh(vertices, faces)


def make_annular_cylinder_z(
    cx: float,
    cy: float,
    z0: float,
    z1: float,
    outer_radius: float,
    inner_radius: float,
    segments: int = 96,
) -> Mesh:
    vertices: list[Vector] = []
    for z in (z0, z1):
        for radius in (outer_radius, inner_radius):
            for index in range(segments):
                angle = (index / segments) * math.tau
                vertices.append((cx + radius * math.cos(angle), cy + radius * math.sin(angle), z))

    ob, ib, ot, it = 0, segments, segments * 2, segments * 3
    faces: list[Face] = []
    for index in range(segments):
        nxt = (index + 1) % segments
        add_quad(faces, ot + index, ob + index, ob + nxt, ot + nxt)
        add_quad(faces, ib + index, it + index, it + nxt, ib + nxt)
        add_quad(faces, ot + index, ot + nxt, it + nxt, it + index)
        add_quad(faces, ob + index, ib + index, ib + nxt, ob + nxt)
    return Mesh(vertices, faces)


def subtract(a: Vector, b: Vector) -> Vector:
    return (a[0] - b[0], a[1] - b[1], a[2] - b[2])


def cross(a: Vector, b: Vector) -> Vector:
    return (
        a[1] * b[2] - a[2] * b[1],
        a[2] * b[0] - a[0] * b[2],
        a[0] * b[1] - a[1] * b[0],
    )


def dot(a: Vector, b: Vector) -> float:
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]


def normalize(vector: Vector) -> Vector:
    length = math.sqrt(dot(vector, vector)) or 1.0
    return (vector[0] / length, vector[1] / length, vector[2] / length)


def triangle_normal(a: Vector, b: Vector, c: Vector) -> Vector:
    return normalize(cross(subtract(b, a), subtract(c, a)))


def export_binary_stl(mesh: Mesh, path: Path, title: str = "SolidWorks Part Reconstruction") -> None:
    header = f"{title}; units=mm"[:80].encode("ascii", "ignore").ljust(80, b" ")
    with path.open("wb") as output:
        output.write(header)
        output.write(struct.pack("<I", len(mesh.faces)))
        for ia, ib, ic in mesh.faces:
            a, b, c = mesh.vertices[ia], mesh.vertices[ib], mesh.vertices[ic]
            normal = triangle_normal(a, b, c)
            output.write(struct.pack("<12fH", *normal, *a, *b, *c, 0))


def render_preview(mesh: Mesh, path: Path, title: str, subtitle: str, badges: list[str]) -> None:
    scale_factor = 2
    width, height = 640 * scale_factor, 640 * scale_factor
    image = Image.new("RGB", (width, height), (246, 249, 253))
    draw = ImageDraw.Draw(image)

    for row in range(height):
        blend = row / max(1, height - 1)
        color = (
            round(248 - 14 * blend),
            round(251 - 16 * blend),
            round(254 - 12 * blend),
        )
        draw.line((0, row, width, row), fill=color)

    for offset in range(0, width, 40 * scale_factor):
        draw.line((offset, 0, offset, height), fill=(230, 238, 246), width=1)
    for offset in range(0, height, 40 * scale_factor):
        draw.line((0, offset, width, offset), fill=(230, 238, 246), width=1)

    eye = (120.0, -160.0, 110.0)
    target = (0.0, 0.0, 20.0)
    forward = normalize(subtract(target, eye))
    right = normalize(cross(forward, (0.0, 0.0, 1.0)))
    up = normalize(cross(right, forward))

    camera_vertices = [
        (dot(vertex, right), dot(vertex, up), dot(vertex, forward))
        for vertex in mesh.vertices
    ]
    min_x = min(vertex[0] for vertex in camera_vertices)
    max_x = max(vertex[0] for vertex in camera_vertices)
    min_y = min(vertex[1] for vertex in camera_vertices)
    max_y = max(vertex[1] for vertex in camera_vertices)

    viewport = (60 * scale_factor, 100 * scale_factor, 580 * scale_factor, 560 * scale_factor)
    viewport_width = viewport[2] - viewport[0]
    viewport_height = viewport[3] - viewport[1]
    projection_scale = min(viewport_width / (max_x - min_x), viewport_height / (max_y - min_y)) * 0.92
    center_x = (min_x + max_x) / 2
    center_y = (min_y + max_y) / 2
    screen_center = ((viewport[0] + viewport[2]) / 2, (viewport[1] + viewport[3]) / 2)

    def project(vertex: tuple[float, float, float]) -> tuple[float, float]:
        return (
            screen_center[0] + ((vertex[0] - center_x) * projection_scale),
            screen_center[1] - ((vertex[1] - center_y) * projection_scale),
        )

    shadow_box = (120 * scale_factor, 480 * scale_factor, 520 * scale_factor, 580 * scale_factor)
    for inset in range(24 * scale_factor, 0, -4):
        alpha = (24 * scale_factor - inset) / (24 * scale_factor)
        shade = round(235 - 28 * alpha)
        draw.ellipse(
            (shadow_box[0] + inset, shadow_box[1] + inset / 3, shadow_box[2] - inset, shadow_box[3] - inset / 3),
            fill=(shade, shade + 4, shade + 8),
        )

    light = normalize((-0.4, -0.6, 0.7))
    triangles = []
    for face in mesh.faces:
        vertices = [mesh.vertices[index] for index in face]
        camera = [camera_vertices[index] for index in face]
        normal = triangle_normal(*vertices)
        # Backface culling: skip faces pointing away from camera
        view_dir = normalize(subtract(vertices[0], eye))
        if dot(normal, view_dir) >= 0.05:
            continue

        center_v = (
            (vertices[0][0] + vertices[1][0] + vertices[2][0]) / 3,
            (vertices[0][1] + vertices[1][1] + vertices[2][1]) / 3,
            (vertices[0][2] + vertices[1][2] + vertices[2][2]) / 3,
        )
        dist_from_eye = math.hypot(center_v[0] - eye[0], center_v[1] - eye[1], center_v[2] - eye[2])
        brightness = 0.42 + (0.58 * max(0.0, dot(normal, light)))
        base_color = (25, 115, 185)
        color = tuple(max(0, min(255, round(channel * brightness))) for channel in base_color)
        triangles.append((dist_from_eye, [project(vertex) for vertex in camera], color))

    # Draw farthest triangles first (descending distance)
    for _, polygon, color in sorted(triangles, key=lambda item: item[0], reverse=True):
        draw.polygon(polygon, fill=color, outline=(18, 75, 125))

    font_path = Path("C:/Windows/Fonts/segoeuib.ttf")
    title_font = ImageFont.truetype(str(font_path), 24 * scale_factor) if font_path.exists() else ImageFont.load_default()
    sub_font = ImageFont.truetype(str(font_path).replace("segoeuib", "segoeui"), 13 * scale_factor) if font_path.exists() else ImageFont.load_default()
    badge_font = ImageFont.truetype(str(font_path), 11 * scale_factor) if font_path.exists() else ImageFont.load_default()

    draw.text((32 * scale_factor, 26 * scale_factor), title, font=title_font, fill=(18, 55, 95))
    draw.text((33 * scale_factor, 58 * scale_factor), subtitle, font=sub_font, fill=(75, 105, 135))

    bx = 32 * scale_factor
    by = 84 * scale_factor
    for b in badges:
        bbox = draw.textbbox((0, 0), b, font=badge_font)
        bw = bbox[2] - bbox[0] + 16 * scale_factor
        draw.rounded_rectangle((bx, by, bx + bw, by + 22 * scale_factor), radius=11 * scale_factor, fill=(225, 238, 250))
        draw.text((bx + 8 * scale_factor, by + 4 * scale_factor), b, font=badge_font, fill=(26, 92, 145))
        bx += bw + 8 * scale_factor

    image.resize((640, 640), Image.Resampling.LANCZOS).save(path, quality=92)


def build_part_2() -> Mesh:
    model = Mesh()
    model.add(make_box(-30, -10, -15, 15, 0, 25))
    model.add(make_box(-10, 10, -15, 15, 0, 50))
    model.add(make_box(10, 30, -15, 15, 0, 25))
    return model


def build_flange_connector() -> Mesh:
    model = Mesh()
    model.add(make_box(-40, 40, -25, 25, 0, 10))
    model.add(make_box(-70, -40, 10, 25, 0, 10))
    model.add(make_box(-70, -40, -25, -10, 0, 10))
    model.add(make_box(40, 70, 10, 25, 0, 10))
    model.add(make_box(40, 70, -25, -10, 0, 10))
    model.add(make_solid_cylinder_z(0, 0, 10, 26, 32))
    model.add(make_annular_cylinder_z(0, 0, 26, 50, 32, 20))
    disc = make_solid_cylinder_z(0, 0, 25.9, 26.0, 20)
    model.add(disc)
    return model


def build_kelas_extrim() -> Mesh:
    model = Mesh()
    model.add(make_box(-30, 30, -30, 25, 0, 5))
    model.add(make_box(-20, 20, 25, 55, 0, 5))
    model.add(make_box(-38, -25, 10, 35, 0, 5))
    model.add(make_box(25, 38, 10, 35, 0, 5))

    model.add(make_annular_cylinder_z(0, -20, 0, 17, 20, 15.5))
    model.add(make_annular_cylinder_z(0, 50, 0, 10, 13.5, 6.75))
    model.add(make_annular_cylinder_z(-37.5, 20, 0, 10, 10, 3.5))
    model.add(make_annular_cylinder_z(37.5, 20, 0, 10, 10, 3.5))

    model.add(make_box(-4, 4, -5, 35, 5, 10))
    model.add(make_box(-20, 20, 18, 23, 5, 10))
    model.add(make_box(-36, -32, -15, 15, 5, 10))
    model.add(make_box(32, 36, -15, 15, 5, 10))

    model.add(make_annular_cylinder_z(-16, 5, 0, 5, 13, 9.5))
    model.add(make_annular_cylinder_z(16, 5, 0, 5, 13, 9.5))
    return model


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    print("Building Part 2 (Stepped T-Block)...")
    m_part2 = build_part_2()
    export_binary_stl(m_part2, OUTPUT_DIR / "part-2.stl", "Part 2 Stepped T-Block")
    render_preview(
        m_part2,
        OUTPUT_DIR / "part-2-preview.png",
        "PART 2 · T-BLOCK",
        "Balok Bertingkat Proyeksi Orthogonal",
        ["60 × 30 × 50 mm", "3 Tingkat", "ISO Kuadran"],
    )

    print("Building Job Flange Connector...")
    m_flange = build_flange_connector()
    export_binary_stl(m_flange, OUTPUT_DIR / "job-flange-connector.stl", "Flanged Slotted Support")
    render_preview(
        m_flange,
        OUTPUT_DIR / "job-flange-connector-preview.png",
        "FLANGE CONNECTOR",
        "Dudukan Flens Poros & Alur Pengunci",
        ["140 × 50 × 50 mm", "Ø64 Boss", "Ø40 Blind Hole", "2 Alur 20 mm"],
    )

    print("Building Job Kelas Extrim...")
    m_extrim = build_kelas_extrim()
    export_binary_stl(m_extrim, OUTPUT_DIR / "job-kelas-extrim.stl", "Job Kelas Extrim Bracket Plate")
    render_preview(
        m_extrim,
        OUTPUT_DIR / "job-kelas-extrim-preview.png",
        "JOB KELAS EXTRIM",
        "Pelat Braket Kompleks & Rusuk Penguat",
        ["105 × 95 × 17 mm", "Ø40 Bore", "3 Telinga Baut", "Rusuk Diagonal"],
    )

    print("All 3 CAD models generated successfully!")


if __name__ == "__main__":
    main()
