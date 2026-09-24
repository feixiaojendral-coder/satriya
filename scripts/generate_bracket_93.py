"""Generate a lightweight 3D preview of Study CADCAM drawing 93.

The production FreeCAD construction lives in bracket-93.FCMacro. This script
uses only Python's standard library plus Pillow so the reference STL, GLB, and
preview can also be generated on machines where FreeCAD is not installed.
Units are millimetres.
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
OUTPUT_DIR = ROOT / "public" / "models" / "bracket-93"


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
    add_quad(faces, 0, 3, 2, 1)
    add_quad(faces, 4, 5, 6, 7)
    add_quad(faces, 0, 1, 5, 4)
    add_quad(faces, 1, 2, 6, 5)
    add_quad(faces, 2, 3, 7, 6)
    add_quad(faces, 3, 0, 4, 7)
    return Mesh(vertices, faces)


def make_annular_cylinder_z(
    cx: float,
    cy: float,
    z0: float,
    z1: float,
    outer_radius: float,
    inner_radius: float,
    segments: int = 72,
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


def make_annular_cylinder_y(
    cx: float,
    y0: float,
    y1: float,
    cz: float,
    outer_radius: float,
    inner_radius: float,
    segments: int = 72,
) -> Mesh:
    vertices: list[Vector] = []
    for y in (y0, y1):
        for radius in (outer_radius, inner_radius):
            for index in range(segments):
                angle = (index / segments) * math.tau
                vertices.append((cx + radius * math.cos(angle), y, cz + radius * math.sin(angle)))

    of, inf, ob, inb = 0, segments, segments * 2, segments * 3
    faces: list[Face] = []
    for index in range(segments):
        nxt = (index + 1) % segments
        add_quad(faces, of + index, ob + index, ob + nxt, of + nxt)
        add_quad(faces, inf + index, inf + nxt, inb + nxt, inb + index)
        add_quad(faces, of + index, of + nxt, inf + nxt, inf + index)
        add_quad(faces, ob + index, inb + index, inb + nxt, ob + nxt)
    return Mesh(vertices, faces)


def make_prism_y(profile_xz: Iterable[tuple[float, float]], y0: float, y1: float) -> Mesh:
    profile = list(profile_xz)
    count = len(profile)
    vertices = [(x, y0, z) for x, z in profile] + [(x, y1, z) for x, z in profile]
    faces: list[Face] = []
    for index in range(1, count - 1):
        faces.append((0, index + 1, index))
        faces.append((count, count + index, count + index + 1))
    for index in range(count):
        nxt = (index + 1) % count
        add_quad(faces, index, nxt, count + nxt, count + index)
    return Mesh(vertices, faces)


def make_prism_x(profile_yz: Iterable[tuple[float, float]], x0: float, x1: float) -> Mesh:
    profile = list(profile_yz)
    count = len(profile)
    vertices = [(x0, y, z) for y, z in profile] + [(x1, y, z) for y, z in profile]
    faces: list[Face] = []
    for index in range(1, count - 1):
        faces.append((0, index, index + 1))
        faces.append((count, count + index + 1, count + index))
    for index in range(count):
        nxt = (index + 1) % count
        add_quad(faces, index, count + index, count + nxt, nxt)
    return Mesh(vertices, faces)


def build_model() -> Mesh:
    model = Mesh()

    # Base, 72 x 35 mm. The tiled pieces preserve both Ø12 through-holes in
    # this dependency-free preview; the FreeCAD macro performs true booleans.
    model.add(make_box(-36, 36, 6, 23, 0, 10))
    model.add(make_box(-18, 18, -6, 6, 0, 10))
    model.add(make_box(-24, 24, -12, -6, 0, 10))
    model.add(make_annular_cylinder_z(-24, 0, 0, 10, 12, 6))
    model.add(make_annular_cylinder_z(24, 0, 0, 10, 12, 6))

    # Upright stem: 30 mm parallel section with two R15 blends into the base.
    stem_profile: list[tuple[float, float]] = []
    for index in range(13):
        angle = math.radians(-90 + (90 * index / 12))
        stem_profile.append((-30 + 15 * math.cos(angle), 25 + 15 * math.sin(angle)))
    stem_profile.extend(((-15, 54), (15, 54)))
    for index in range(13):
        angle = math.radians(180 + (90 * index / 12))
        stem_profile.append((30 + 15 * math.cos(angle), 25 + 15 * math.sin(angle)))
    model.add(make_prism_y(stem_profile, 5, 18))

    # Ø30 boss, Ø12 through-hole, 13 mm thick.
    model.add(make_annular_cylinder_y(0, 5, 18, 60, 15, 6))

    # Central 10 mm rib at 60 degrees, running toward the front of the base.
    rib_height = 10 + (17 * math.tan(math.radians(60)))
    model.add(make_prism_x(((-12, 10), (5, 10), (5, rib_height)), -5, 5))
    return model


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


def export_binary_stl(mesh: Mesh, path: Path) -> None:
    header = b"Bracket 93 reconstructed from technical drawing; units=mm"[:80].ljust(80, b" ")
    with path.open("wb") as output:
        output.write(header)
        output.write(struct.pack("<I", len(mesh.faces)))
        for ia, ib, ic in mesh.faces:
            a, b, c = mesh.vertices[ia], mesh.vertices[ib], mesh.vertices[ic]
            normal = triangle_normal(a, b, c)
            output.write(struct.pack("<12fH", *normal, *a, *b, *c, 0))


def export_glb(mesh: Mesh, path: Path) -> None:
    positions: list[float] = []
    normals: list[float] = []
    indices: list[int] = []

    for face in mesh.faces:
        source = [mesh.vertices[index] for index in face]
        normal = triangle_normal(*source)
        # Convert the engineering Z-up coordinates to glTF's Y-up convention.
        converted_normal = (normal[0], normal[2], -normal[1])
        for vertex in source:
            positions.extend((vertex[0], vertex[2], -vertex[1]))
            normals.extend(converted_normal)
            indices.append(len(indices))

    position_bytes = struct.pack(f"<{len(positions)}f", *positions)
    normal_bytes = struct.pack(f"<{len(normals)}f", *normals)
    index_bytes = struct.pack(f"<{len(indices)}I", *indices)
    binary = position_bytes + normal_bytes + index_bytes
    binary += b"\x00" * ((4 - len(binary) % 4) % 4)

    converted_vertices = [(x, z, -y) for x, y, z in mesh.vertices]
    mins = [min(vertex[axis] for vertex in converted_vertices) for axis in range(3)]
    maxs = [max(vertex[axis] for vertex in converted_vertices) for axis in range(3)]
    position_length = len(position_bytes)
    normal_offset = position_length
    index_offset = normal_offset + len(normal_bytes)

    gltf = {
        "asset": {"version": "2.0", "generator": "DraftLab Bracket 93 generator", "extras": {"units": "millimetres"}},
        "scene": 0,
        "scenes": [{"nodes": [0]}],
        "nodes": [{"mesh": 0, "name": "Bracket 93"}],
        "meshes": [{"name": "Bracket 93", "primitives": [{"attributes": {"POSITION": 0, "NORMAL": 1}, "indices": 2, "material": 0}]}],
        "materials": [{
            "name": "Engineering blue",
            "doubleSided": True,
            "pbrMetallicRoughness": {
                "baseColorFactor": [0.035, 0.44, 0.64, 1.0],
                "metallicFactor": 0.08,
                "roughnessFactor": 0.38,
            },
        }],
        "buffers": [{"byteLength": len(binary)}],
        "bufferViews": [
            {"buffer": 0, "byteOffset": 0, "byteLength": position_length, "target": 34962},
            {"buffer": 0, "byteOffset": normal_offset, "byteLength": len(normal_bytes), "target": 34962},
            {"buffer": 0, "byteOffset": index_offset, "byteLength": len(index_bytes), "target": 34963},
        ],
        "accessors": [
            {"bufferView": 0, "componentType": 5126, "count": len(indices), "type": "VEC3", "min": mins, "max": maxs},
            {"bufferView": 1, "componentType": 5126, "count": len(indices), "type": "VEC3"},
            {"bufferView": 2, "componentType": 5125, "count": len(indices), "type": "SCALAR"},
        ],
    }

    json_bytes = json.dumps(gltf, separators=(",", ":")).encode("utf-8")
    json_bytes += b" " * ((4 - len(json_bytes) % 4) % 4)
    total_length = 12 + 8 + len(json_bytes) + 8 + len(binary)
    with path.open("wb") as output:
        output.write(struct.pack("<4sII", b"glTF", 2, total_length))
        output.write(struct.pack("<I4s", len(json_bytes), b"JSON"))
        output.write(json_bytes)
        output.write(struct.pack("<I4s", len(binary), b"BIN\x00"))
        output.write(binary)


def load_font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    font_name = "segoeuib.ttf" if bold else "segoeui.ttf"
    font_path = Path("C:/Windows/Fonts") / font_name
    if font_path.exists():
        return ImageFont.truetype(str(font_path), size)
    return ImageFont.load_default()


def render_preview(mesh: Mesh, path: Path) -> None:
    scale_factor = 2
    width, height = 1200 * scale_factor, 900 * scale_factor
    image = Image.new("RGB", (width, height), (244, 248, 252))
    draw = ImageDraw.Draw(image)

    # Soft blueprint-style background.
    for row in range(height):
        blend = row / max(1, height - 1)
        color = (
            round(247 - 13 * blend),
            round(250 - 15 * blend),
            round(253 - 12 * blend),
        )
        draw.line((0, row, width, row), fill=color)
    for offset in range(0, width, 80 * scale_factor):
        draw.line((offset, 0, offset, height), fill=(226, 234, 242), width=1)
    for offset in range(0, height, 80 * scale_factor):
        draw.line((0, offset, width, offset), fill=(226, 234, 242), width=1)

    eye = (112.0, -154.0, 108.0)
    target = (0.0, 4.0, 32.0)
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
    viewport = (190 * scale_factor, 130 * scale_factor, 1010 * scale_factor, 760 * scale_factor)
    viewport_width = viewport[2] - viewport[0]
    viewport_height = viewport[3] - viewport[1]
    projection_scale = min(viewport_width / (max_x - min_x), viewport_height / (max_y - min_y))
    center_x = (min_x + max_x) / 2
    center_y = (min_y + max_y) / 2
    screen_center = ((viewport[0] + viewport[2]) / 2, (viewport[1] + viewport[3]) / 2)

    def project(vertex: tuple[float, float, float]) -> tuple[float, float]:
        return (
            screen_center[0] + ((vertex[0] - center_x) * projection_scale),
            screen_center[1] - ((vertex[1] - center_y) * projection_scale),
        )

    # Grounding shadow beneath the part.
    shadow_box = (245 * scale_factor, 675 * scale_factor, 990 * scale_factor, 795 * scale_factor)
    for inset in range(34 * scale_factor, 0, -4):
        alpha = (34 * scale_factor - inset) / (34 * scale_factor)
        shade = round(231 - 24 * alpha)
        draw.ellipse(
            (shadow_box[0] + inset, shadow_box[1] + inset / 4, shadow_box[2] - inset, shadow_box[3] - inset / 4),
            fill=(shade, shade + 5, shade + 10),
        )

    light = normalize((-0.35, -0.6, 0.72))
    triangles = []
    for face in mesh.faces:
        vertices = [mesh.vertices[index] for index in face]
        camera = [camera_vertices[index] for index in face]
        normal = triangle_normal(*vertices)
        depth = sum(vertex[2] for vertex in camera) / 3
        brightness = 0.34 + (0.66 * abs(dot(normal, light)))
        base_color = (14, 128, 177)
        color = tuple(max(0, min(255, round(channel * brightness))) for channel in base_color)
        triangles.append((depth, [project(vertex) for vertex in camera], color))

    for _, polygon, color in sorted(triangles, key=lambda item: item[0]):
        draw.polygon(polygon, fill=color)

    # Header and concise reconstruction notes.
    title_font = load_font(38 * scale_factor, bold=True)
    subtitle_font = load_font(17 * scale_factor)
    badge_font = load_font(14 * scale_factor, bold=True)
    draw.text((64 * scale_factor, 48 * scale_factor), "BRACKET 93 · MODEL 3D", font=title_font, fill=(15, 54, 91))
    draw.text(
        (66 * scale_factor, 98 * scale_factor),
        "Rekonstruksi parametrik dari gambar teknik 2D",
        font=subtitle_font,
        fill=(73, 101, 127),
    )

    badges = ("72 × 35 mm", "3 × Ø12", "R15", "Rib 60°", "Tebal boss 13 mm")
    x = 66 * scale_factor
    y = 142 * scale_factor
    for label in badges:
        text_box = draw.textbbox((0, 0), label, font=badge_font)
        badge_width = text_box[2] - text_box[0] + 26 * scale_factor
        draw.rounded_rectangle((x, y, x + badge_width, y + 34 * scale_factor), radius=17 * scale_factor, fill=(220, 235, 247))
        draw.text((x + 13 * scale_factor, y + 7 * scale_factor), label, font=badge_font, fill=(34, 91, 136))
        x += badge_width + 10 * scale_factor

    note_font = load_font(13 * scale_factor)
    draw.rounded_rectangle(
        (64 * scale_factor, 814 * scale_factor, 666 * scale_factor, 860 * scale_factor),
        radius=10 * scale_factor,
        fill=(255, 247, 224),
        outline=(232, 199, 119),
        width=1 * scale_factor,
    )
    draw.text(
        (82 * scale_factor, 828 * scale_factor),
        "Asumsi contoh: ketebalan alas 10 mm (gambar juga menampilkan angka 6 mm).",
        font=note_font,
        fill=(119, 83, 18),
    )

    image.resize((1200, 900), Image.Resampling.LANCZOS).save(path, quality=94)


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    model = build_model()
    export_binary_stl(model, OUTPUT_DIR / "bracket-93-reference.stl")
    export_glb(model, OUTPUT_DIR / "bracket-93-reference.glb")
    render_preview(model, OUTPUT_DIR / "bracket-93-preview.png")
    print(f"Generated {len(model.vertices)} vertices and {len(model.faces)} triangles")


if __name__ == "__main__":
    main()
