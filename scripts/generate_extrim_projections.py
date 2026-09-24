import struct
import math
from collections import defaultdict
from pathlib import Path

def generate_projections():
    stl_path = Path("public/models/solidworks-library/job-kelas-extrim.stl")
    if not stl_path.exists():
        print("STL not found!")
        return

    with open(stl_path, "rb") as f:
        f.seek(80)
        n = struct.unpack("<I", f.read(4))[0]
        triangles = []
        for _ in range(n):
            d = struct.unpack("<12fH", f.read(50))
            triangles.append((d[:3], d[3:6], d[6:9], d[9:12]))

    xs = [v[0] for t in triangles for v in t[1:]]
    ys = [v[1] for t in triangles for v in t[1:]]
    zs = [v[2] for t in triangles for v in t[1:]]
    min_x, max_x = min(xs), max(xs)
    min_y, max_y = min(ys), max(ys)
    min_z, max_z = min(zs), max(zs)

    def pt_key(p):
        return (round(p[0], 2), round(p[1], 2), round(p[2], 2))

    edges = defaultdict(list)
    for norm, v0, v1, v2 in triangles:
        pts = [pt_key(v0), pt_key(v1), pt_key(v2)]
        for i in range(3):
            p1, p2 = pts[i], pts[(i + 1) % 3]
            edge_key = tuple(sorted([p1, p2]))
            edges[edge_key].append(norm)

    crease_edges = []
    for edge_key, norm_list in edges.items():
        if len(norm_list) == 1:
            crease_edges.append(edge_key)
        elif len(norm_list) == 2:
            n1, n2 = norm_list[0], norm_list[1]
            dot = n1[0] * n2[0] + n1[1] * n2[1] + n1[2] * n2[2]
            if dot < 0.88:
                crease_edges.append(edge_key)

    def generate_svg(proj_fn, bounds, view_w=100, view_h=100, pad=10):
        (b_min_u, b_max_u), (b_min_v, b_max_v) = bounds
        scale = min(
            (view_w - 2 * pad) / max(0.001, (b_max_u - b_min_u)),
            (view_h - 2 * pad) / max(0.001, (b_max_v - b_min_v)),
        )
        cu = (b_min_u + b_max_u) / 2
        cv = (b_min_v + b_max_v) / 2

        segments = []
        for p1, p2 in crease_edges:
            u1, v1 = proj_fn(p1)
            u2, v2 = proj_fn(p2)
            su1 = round(view_w / 2 + (u1 - cu) * scale, 2)
            sv1 = round(view_h / 2 - (v1 - cv) * scale, 2)
            su2 = round(view_w / 2 + (u2 - cu) * scale, 2)
            sv2 = round(view_h / 2 - (v2 - cv) * scale, 2)

            if math.hypot(su2 - su1, sv2 - sv1) < 0.4:
                continue
            segments.append(f"M{su1},{sv1} L{su2},{sv2}")

        path_d = " ".join(segments)
        return f'<svg viewBox="0 0 {view_w} {view_h}" xmlns="http://www.w3.org/2000/svg"><path d="{path_d}" fill="none" stroke="var(--color-cyan)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>'

    # Front: looking along -Y (X, Z)
    svg_front = generate_svg(lambda p: (p[0], p[2]), ((min_x, max_x), (min_z, max_z)))
    # Top: looking along -Z (X, -Y)
    svg_top = generate_svg(lambda p: (p[0], -p[1]), ((min_x, max_x), (-max_y, -min_y)))
    # Right: looking along -X (Y, Z)
    svg_right = generate_svg(lambda p: (p[1], p[2]), ((min_y, max_y), (min_z, max_z)))
    # Left: looking along +X (-Y, Z)
    svg_left = generate_svg(lambda p: (-p[1], p[2]), ((-max_y, -min_y), (min_z, max_z)))
    # Bottom: looking along +Z (X, Y)
    svg_bottom = generate_svg(lambda p: (p[0], p[1]), ((min_x, max_x), (min_y, max_y)))
    # Back: looking along +Y (-X, Z)
    svg_back = generate_svg(lambda p: (-p[0], p[2]), ((-max_x, -min_x), (min_z, max_z)))

    out_dir = Path("public/models/solidworks-library/views-extrim")
    out_dir.mkdir(parents=True, exist_ok=True)
    (out_dir / "front.svg").write_text(svg_front, encoding="utf-8")
    (out_dir / "top.svg").write_text(svg_top, encoding="utf-8")
    (out_dir / "right.svg").write_text(svg_right, encoding="utf-8")
    (out_dir / "left.svg").write_text(svg_left, encoding="utf-8")
    (out_dir / "bottom.svg").write_text(svg_bottom, encoding="utf-8")
    (out_dir / "back.svg").write_text(svg_back, encoding="utf-8")

    # Also output a JSON file with the SVG strings for easy JS loading
    import json
    views_json = {
        "front": svg_front,
        "top": svg_top,
        "right": svg_right,
        "left": svg_left,
        "bottom": svg_bottom,
        "back": svg_back
    }
    (out_dir / "views.json").write_text(json.dumps(views_json), encoding="utf-8")
    print("All orthographic SVGs and views.json generated successfully!")

if __name__ == "__main__":
    generate_projections()
