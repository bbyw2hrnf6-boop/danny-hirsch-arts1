"""Build the bounded Danny Hirsch Arts 360 gallery for the web.

Run from the repository root:

    /Applications/Blender.app/Contents/MacOS/Blender \
      --background --factory-startup \
      --python blender/create_walkable_gallery.py

The architecture is a designed spatial interpretation, not a scan.  The
wARTrobe uses the genuine complete front photograph.  The six side apertures
use genuine macro/detail photographs and are deliberately labelled in glTF
extras as surface details, never as complete artwork simulations. Optional
site-demo boards carry the existing About, Process, Inquiry and legal copy.
"""

from __future__ import annotations

import json
import math
import random
from pathlib import Path
from typing import Iterable

import bpy
from mathutils import Vector


ROOT = Path(__file__).resolve().parents[1]
OUTPUT_DIR = ROOT / "assets" / "cinematic"
BLEND_PATH = ROOT / "blender" / "danny-gallery-360.blend"
GLB_PATH = OUTPUT_DIR / "danny-gallery-360.glb"

WARTROBE_TEXTURE = ROOT / "assets" / "optimized" / "gallery" / "gallery-04.webp"
SURFACE_TEXTURES = [
    ROOT / "assets" / "optimized" / "artworks" / f"artwork-{index:02d}.webp"
    for index in range(1, 7)
]
MATERIAL_TEXTURES = {
    "limestone": ROOT / "assets" / "materials" / "dark-limestone.webp",
    "walnut": ROOT / "assets" / "materials" / "smoked-walnut.webp",
    "leather": ROOT / "assets" / "materials" / "saddle-leather.webp",
}

ARTWORK_CATALOG = [
    {
        "title": "Yellow Field, Veined",
        "year": "2026",
        "medium": "Mixed Media on Canvas",
        "dimensions": "40 × 50 cm",
        "availability": "Available",
        "description": "A charged botanical trace held inside a saturated field of light.",
    },
    {
        "title": "Black Current",
        "year": "2026",
        "medium": "Acrylic on Canvas",
        "dimensions": "40 × 50 cm",
        "availability": "Available",
        "description": "Dark movement breaks into mineral gold, fluid and deliberate.",
    },
    {
        "title": "Soft Terrain",
        "year": "2026",
        "medium": "Mixed Media on Canvas",
        "dimensions": "40 × 50 cm",
        "availability": "Available",
        "description": "Color drifts across the surface like atmosphere settling into matter.",
    },
    {
        "title": "Oxide Drift",
        "year": "2026",
        "medium": "Acrylic and Mineral Pigment on Canvas",
        "dimensions": "40 × 50 cm",
        "availability": "Available",
        "description": "A low, metallic landscape shaped by pressure, reflection, and restraint.",
    },
    {
        "title": "Blue Aperture",
        "year": "2026",
        "medium": "Acrylic on Canvas",
        "dimensions": "40 × 50 cm",
        "availability": "Available",
        "description": "Cool blues and silver tones open into a deep, architectural field.",
    },
    {
        "title": "Nocturne Relic",
        "year": "2026",
        "medium": "Mixed Media Assemblage",
        "dimensions": "40 × 50 cm",
        "availability": "Available",
        "description": "Raw material interrupts a luminous ground with sculptural tension.",
    },
]

SITE_PANELS = [
    {
        "id": "about",
        "title": "About the practice",
        "kicker": "06 · Practice",
        "body": "My work begins with a feeling before it has an image. Nature, weathered surfaces, architecture, and memory guide a slow process of layering, covering, and revealing.",
        "link": "#about",
        "link_label": "Enter the studio story",
    },
    {
        "id": "process",
        "title": "Material process",
        "kicker": "Ground · Layer · Pressure · Reveal",
        "body": "Control meets accident as pigment, fibers, leaves, pressure, and time determine the final surface.",
        "link": "#about",
        "link_label": "Explore the process",
    },
    {
        "id": "inquiry",
        "title": "Private inquiry",
        "kicker": "Viewings · Commissions · Acquisitions",
        "body": "Begin a private conversation about available works, commissions, or a studio viewing.",
        "link": "mailto:dannyhirscharts@protonmail.com",
        "link_label": "Email the studio",
    },
    {
        "id": "privacy",
        "title": "Privacy, without noise",
        "kicker": "Legal · Privacy",
        "body": "This website collects as little information as possible. Optional third-party content remains off until you choose to enable it.",
        "link": "privacy.html",
        "link_label": "Read privacy policy",
    },
    {
        "id": "imprint",
        "title": "The work. The studio.",
        "kicker": "Legal · Imprint",
        "body": "Publisher, contact, copyright, and external-link information for the Danny Hirsch Arts digital exhibition.",
        "link": "imprint.html",
        "link_label": "Read imprint",
    },
]

ROOM_HALF_WIDTH = 7.0
ROOM_HALF_DEPTH = 8.0
ROOM_HEIGHT = 5.8
WALK_EYE_HEIGHT = 1.65
WALK_BOUNDS = (-6.20, 6.20, -7.00, 6.62)  # xmin, xmax, ymin, ymax in Blender XY.

WEB_OBJECTS: list[bpy.types.Object] = []


def clean_scene() -> None:
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for datablocks in (
        bpy.data.meshes,
        bpy.data.curves,
        bpy.data.materials,
        bpy.data.cameras,
        bpy.data.lights,
        bpy.data.images,
    ):
        for datablock in list(datablocks):
            if datablock.users == 0:
                datablocks.remove(datablock)


def srgb_to_linear_component(value: float) -> float:
    return value / 12.92 if value <= 0.04045 else ((value + 0.055) / 1.055) ** 2.4


def rgba(hex_value: str, alpha: float = 1.0) -> tuple[float, float, float, float]:
    value = hex_value.lstrip("#")
    srgb = tuple(int(value[index : index + 2], 16) / 255 for index in (0, 2, 4))
    return (*(srgb_to_linear_component(component) for component in srgb), alpha)


def set_socket(node: bpy.types.Node, name: str, value) -> None:
    socket = node.inputs.get(name)
    if socket is not None:
        socket.default_value = value


def mark_web(obj: bpy.types.Object) -> bpy.types.Object:
    obj["web_export"] = True
    if obj not in WEB_OBJECTS:
        WEB_OBJECTS.append(obj)
    return obj


def set_theme_metadata(target, role: str, dark: str, light: str) -> None:
    target["theme_role"] = role
    target["theme_dark"] = dark
    target["theme_light"] = light


def create_material(
    name: str,
    dark_color: str,
    light_color: str,
    role: str,
    *,
    roughness: float = 0.6,
    metallic: float = 0.0,
    emission: str | None = None,
    emission_strength: float = 0.0,
    clearcoat: float = 0.0,
    clearcoat_roughness: float = 0.2,
) -> bpy.types.Material:
    material = bpy.data.materials.new(name)
    material.use_nodes = True
    principled = material.node_tree.nodes.get("Principled BSDF")
    set_socket(principled, "Base Color", rgba(dark_color))
    set_socket(principled, "Roughness", roughness)
    set_socket(principled, "Metallic", metallic)
    set_socket(principled, "Coat Weight", clearcoat)
    set_socket(principled, "Clearcoat", clearcoat)
    set_socket(principled, "Coat Roughness", clearcoat_roughness)
    set_socket(principled, "Clearcoat Roughness", clearcoat_roughness)
    if emission:
        set_socket(principled, "Emission Color", rgba(emission))
        set_socket(principled, "Emission Strength", emission_strength)
    set_theme_metadata(material, role, dark_color, light_color)
    material["dark_roughness"] = roughness
    material["light_roughness"] = min(1.0, roughness + 0.06)
    material["web_clearcoat"] = clearcoat
    material["web_clearcoat_roughness"] = clearcoat_roughness
    return material


def create_textured_material(
    name: str,
    image_path: Path,
    dark_color: str,
    light_color: str,
    role: str,
    *,
    roughness: float,
    metallic: float = 0.0,
    clearcoat: float = 0.0,
    clearcoat_roughness: float = 0.2,
) -> bpy.types.Material:
    """Create PBR architecture material from a neutral generated scan.

    These images are room-only albedo sources. They are explicitly marked as
    generated architectural material and can never be discovered as artwork.
    """
    material = create_material(
        name,
        dark_color,
        light_color,
        role,
        roughness=roughness,
        metallic=metallic,
        clearcoat=clearcoat,
        clearcoat_roughness=clearcoat_roughness,
    )
    image = load_web_image(image_path, maximum_edge=1024)
    nodes = material.node_tree.nodes
    links = material.node_tree.links
    principled = nodes.get("Principled BSDF")
    texture = nodes.new("ShaderNodeTexImage")
    texture.name = f"{name}_Architectural_Albedo"
    texture.label = f"Generated room material: {image_path.name}"
    texture.image = image
    texture.interpolation = "Linear"
    texture.extension = "REPEAT"
    links.new(texture.outputs["Color"], principled.inputs["Base Color"])
    material["generated_architectural_texture"] = True
    material["source_asset"] = str(image_path.relative_to(ROOT))
    material["uv_variation"] = True
    return material


def load_web_image(path: Path, maximum_edge: int = 1024) -> bpy.types.Image:
    if not path.exists():
        raise FileNotFoundError(f"Missing local source image: {path}")
    image = bpy.data.images.load(str(path), check_existing=True)
    image.colorspace_settings.name = "sRGB"
    width, height = image.size
    edge = max(width, height)
    if edge > maximum_edge:
        scale = maximum_edge / edge
        image.scale(max(1, round(width * scale)), max(1, round(height * scale)))
    image.pack()
    return image


def create_image_material(
    name: str,
    image_path: Path,
    *,
    role: str,
    maximum_edge: int = 1024,
    emission_strength: float = 0.055,
) -> tuple[bpy.types.Material, float]:
    image = load_web_image(image_path, maximum_edge=maximum_edge)
    width, height = image.size
    material = bpy.data.materials.new(name)
    material.use_nodes = True
    nodes = material.node_tree.nodes
    links = material.node_tree.links
    principled = nodes.get("Principled BSDF")
    texture = nodes.new("ShaderNodeTexImage")
    texture.name = f"{name}_Genuine_Image"
    texture.label = f"Genuine local image: {image_path.name}"
    texture.image = image
    texture.interpolation = "Linear"
    links.new(texture.outputs["Color"], principled.inputs["Base Color"])
    set_socket(principled, "Roughness", 0.52)
    set_socket(principled, "Metallic", 0.0)
    emission_input = principled.inputs.get("Emission Color")
    if emission_input is not None:
        links.new(texture.outputs["Color"], emission_input)
        set_socket(principled, "Emission Strength", emission_strength)
    material["theme_role"] = role
    material["source_asset"] = str(image_path.relative_to(ROOT))
    material["colour_locked"] = True
    return material, width / height


def assign_material(obj: bpy.types.Object, material: bpy.types.Material) -> None:
    obj.data.materials.append(material)


def add_box(
    name: str,
    location: tuple[float, float, float],
    dimensions: tuple[float, float, float],
    material: bpy.types.Material,
    *,
    bevel: float = 0.0,
    theme_role: str | None = None,
    web: bool = True,
) -> bpy.types.Object:
    bpy.ops.mesh.primitive_cube_add(location=location)
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = dimensions
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    assign_material(obj, material)
    if material.get("uv_variation") and obj.data.uv_layers.active:
        # Offset and occasionally mirror each object so a repeated source scan
        # does not reveal an obvious tiled pattern across the gallery floor.
        variation = sum((index + 1) * ord(character) for index, character in enumerate(name))
        offset_u = ((variation * 37) % 997) / 997
        offset_v = ((variation * 61) % 991) / 991
        mirror = -1 if variation % 2 else 1
        for uv in obj.data.uv_layers.active.data:
            uv.uv.x = (uv.uv.x - 0.5) * mirror + 0.5 + offset_u
            uv.uv.y = uv.uv.y + offset_v
    if bevel:
        modifier = obj.modifiers.new("Architectural edge", "BEVEL")
        modifier.width = bevel
        modifier.segments = 2
    if theme_role:
        obj["theme_role"] = theme_role
    if web:
        mark_web(obj)
    return obj


def add_cylinder(
    name: str,
    location: tuple[float, float, float],
    radius: float,
    depth: float,
    material: bpy.types.Material,
    *,
    vertices: int = 16,
    web: bool = True,
) -> bpy.types.Object:
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=vertices,
        radius=radius,
        depth=depth,
        location=location,
    )
    obj = bpy.context.object
    obj.name = name
    assign_material(obj, material)
    if web:
        mark_web(obj)
    return obj


def add_torus(
    name: str,
    location: tuple[float, float, float],
    major_radius: float,
    minor_radius: float,
    material: bpy.types.Material,
    *,
    major_segments: int = 28,
    minor_segments: int = 8,
) -> bpy.types.Object:
    bpy.ops.mesh.primitive_torus_add(
        major_radius=major_radius,
        minor_radius=minor_radius,
        major_segments=major_segments,
        minor_segments=minor_segments,
        location=location,
    )
    obj = bpy.context.object
    obj.name = name
    assign_material(obj, material)
    mark_web(obj)
    return obj


def apply_modifiers(obj: bpy.types.Object) -> None:
    for modifier in list(obj.modifiers):
        bpy.ops.object.select_all(action="DESELECT")
        obj.select_set(True)
        bpy.context.view_layer.objects.active = obj
        bpy.ops.object.modifier_apply(modifier=modifier.name)


def join_meshes(
    name: str,
    objects: Iterable[bpy.types.Object],
    *,
    theme_role: str,
) -> bpy.types.Object | None:
    meshes = [obj for obj in objects if obj and obj.name in bpy.context.scene.objects and obj.type == "MESH"]
    if not meshes:
        return None
    for obj in meshes:
        apply_modifiers(obj)
    if len(meshes) == 1:
        joined = meshes[0]
        joined.name = name
        joined["theme_role"] = theme_role
        mark_web(joined)
        return joined
    bpy.ops.object.select_all(action="DESELECT")
    for obj in meshes:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = meshes[0]
    bpy.ops.object.join()
    joined = bpy.context.object
    joined.name = name
    joined["theme_role"] = theme_role
    mark_web(joined)
    return joined


def add_vertical_panel(
    name: str,
    side: str,
    center: tuple[float, float, float],
    width: float,
    height: float,
    material: bpy.types.Material,
) -> bpy.types.Object:
    """Create an inward-facing, correctly oriented, non-mirrored image plane."""
    half_width = width / 2
    half_height = height / 2
    if side == "north":
        vertices = [
            (-half_width, 0, -half_height),
            (half_width, 0, -half_height),
            (half_width, 0, half_height),
            (-half_width, 0, half_height),
        ]
    elif side == "south":
        vertices = [
            (half_width, 0, -half_height),
            (-half_width, 0, -half_height),
            (-half_width, 0, half_height),
            (half_width, 0, half_height),
        ]
    elif side == "west":
        vertices = [
            (0, -half_width, -half_height),
            (0, half_width, -half_height),
            (0, half_width, half_height),
            (0, -half_width, half_height),
        ]
    elif side == "east":
        vertices = [
            (0, half_width, -half_height),
            (0, -half_width, -half_height),
            (0, -half_width, half_height),
            (0, half_width, half_height),
        ]
    else:
        raise ValueError(f"Unknown panel side: {side}")

    mesh = bpy.data.meshes.new(f"{name}_Mesh")
    mesh.from_pydata(vertices, [], [tuple(range(len(vertices)))])
    mesh.update()
    uv_layer = mesh.uv_layers.new(name="UVMap")
    for loop, uv in zip(mesh.polygons[0].loop_indices, ((0, 0), (1, 0), (1, 1), (0, 1))):
        uv_layer.data[loop].uv = uv
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    obj.location = center
    assign_material(obj, material)
    mark_web(obj)
    return obj


def add_empty(
    name: str,
    location: tuple[float, float, float],
    *,
    display_type: str = "PLAIN_AXES",
    display_size: float = 0.28,
    web: bool = True,
) -> bpy.types.Object:
    obj = bpy.data.objects.new(name, None)
    bpy.context.collection.objects.link(obj)
    obj.location = location
    obj.empty_display_type = display_type
    obj.empty_display_size = display_size
    if web:
        mark_web(obj)
    return obj


def look_at(obj: bpy.types.Object, target: Vector) -> None:
    obj.rotation_euler = (target - obj.location).to_track_quat("-Z", "Y").to_euler()


def add_view_anchor(
    name: str,
    location: tuple[float, float, float],
    target: tuple[float, float, float],
    *,
    label: str,
    kind: str,
    surface_index: int | None = None,
) -> bpy.types.Object:
    anchor = add_empty(name, location, display_type="ARROWS", display_size=0.34)
    look_at(anchor, Vector(target))
    anchor["navigation_role"] = "view_anchor"
    anchor["view_id"] = name.removeprefix("VIEW_").lower()
    anchor["view_label"] = label
    anchor["view_kind"] = kind
    anchor["eye_height"] = WALK_EYE_HEIGHT
    if surface_index is not None:
        anchor["surface_index"] = surface_index
        anchor["target_node"] = f"SURFACE_DETAIL_{surface_index:02d}"
    return anchor


def add_collider(
    name: str,
    center: tuple[float, float, float],
    dimensions: tuple[float, float, float],
) -> bpy.types.Object:
    half = tuple(value / 2 for value in dimensions)
    collider = add_empty(name, center, display_type="CUBE", display_size=1.0)
    collider.scale = half
    collider["navigation_role"] = "collider"
    collider["collider_type"] = "aabb"
    collider["half_extents_blender_xyz"] = list(half)
    collider["half_extents_gltf_xyz"] = [half[0], half[2], half[1]]
    collider["half_extents"] = [half[0], half[2], half[1]]
    collider["coordinate_note"] = "Blender XYZ maps to glTF/Three X,Y,Z as X,Z,-Y"
    return collider


def add_light(
    name: str,
    light_type: str,
    location: tuple[float, float, float],
    target: tuple[float, float, float],
    color: tuple[float, float, float],
    energy: float,
    *,
    web: bool,
    theme_role: str,
    spot_size: float = math.radians(36),
    spot_blend: float = 0.62,
) -> bpy.types.Object:
    data = bpy.data.lights.new(name=name, type=light_type)
    data.color = color
    data.energy = energy
    if light_type == "SPOT":
        data.spot_size = spot_size
        data.spot_blend = spot_blend
        data.shadow_soft_size = 0.32
        data.use_shadow = True
    elif light_type == "AREA":
        data.shape = "RECTANGLE"
        data.size = 3.5
        data.size_y = 2.0
    obj = bpy.data.objects.new(name, data)
    bpy.context.collection.objects.link(obj)
    obj.location = location
    look_at(obj, Vector(target))
    obj["theme_role"] = theme_role
    obj["dark_energy"] = energy
    obj["light_energy"] = energy * 0.58
    obj["dark_colour"] = list(color)
    obj["light_colour"] = [1.0, 0.91, 0.78]
    if web:
        mark_web(obj)
    return obj


def add_spot_fixture(
    light: bpy.types.Object,
    name: str,
    materials: dict[str, bpy.types.Material],
    groups: dict[str, list[bpy.types.Object]],
) -> None:
    """Give each exported spotlight a small, believable architectural source."""
    fixture_location = light.location.copy()
    housing = add_cylinder(
        f"{name}_Housing",
        tuple(fixture_location),
        0.13,
        0.27,
        materials["shadow"],
        vertices=14,
    )
    housing.rotation_euler = light.rotation_euler
    housing["theme_role"] = "shadow"
    groups["shadow"].append(housing)
    aperture = add_cylinder(
        f"{name}_Aperture",
        tuple(fixture_location),
        0.077,
        0.278,
        materials["emissive"],
        vertices=14,
    )
    aperture.rotation_euler = light.rotation_euler
    aperture["theme_role"] = "emissive"
    groups["emissive"].append(aperture)
    # Put the emitting point just beyond the modeled aperture. Otherwise the
    # housing can self-occlude when a runtime enables shadow casting.
    forward = light.rotation_euler.to_matrix() @ Vector((0.0, 0.0, -1.0))
    light.location = fixture_location + forward * 0.18


def add_surface_portal(
    index: int,
    side: str,
    along_wall: float,
    image_path: Path,
    materials: dict[str, bpy.types.Material],
    groups: dict[str, list[bpy.types.Object]],
) -> bpy.types.Object:
    catalogue = ARTWORK_CATALOG[index - 1]
    image_material, ratio = create_image_material(
        f"SURFACE_DETAIL_{index:02d}_LOCKED",
        image_path,
        role="surface_detail_locked",
        maximum_edge=1024,
    )
    if ratio >= 1.0:
        width = 2.48
        height = width / ratio
    else:
        height = 2.72
        width = height * ratio
    center_z = 2.72
    wall_x = -6.79 if side == "west" else 6.79
    center = (wall_x, along_wall, center_z)

    back_x = -6.87 if side == "west" else 6.87
    groups["shadow"].append(add_box(
        f"Surface_{index:02d}_Recess",
        (back_x, along_wall, center_z),
        (0.10, width + 0.42, height + 0.42),
        materials["shadow"],
        bevel=0.035,
        theme_role="shadow",
    ))

    frame_x = -6.75 if side == "west" else 6.75
    bar = 0.055
    depth = 0.14
    for suffix, y, z, dimensions in (
        ("Bottom", along_wall, center_z - height / 2 - bar / 2, (depth, width + bar * 2, bar)),
        ("Top", along_wall, center_z + height / 2 + bar / 2, (depth, width + bar * 2, bar)),
        ("Left", along_wall - width / 2 - bar / 2, center_z, (depth, bar, height + bar * 2)),
        ("Right", along_wall + width / 2 + bar / 2, center_z, (depth, bar, height + bar * 2)),
    ):
        groups["bronze"].append(add_box(
            f"Surface_{index:02d}_Frame_{suffix}",
            (frame_x, y, z),
            dimensions,
            materials["bronze"],
            bevel=0.012,
            theme_role="bronze",
        ))

    # A proper museum label sits beside every genuine surface photograph.
    # The modeled linework makes it legible as an object at room scale; the
    # exact accessible catalogue copy is supplied by the DOM information card.
    plaque_x = -6.695 if side == "west" else 6.695
    plaque_y = along_wall + width / 2 + 0.56
    plaque_z = max(1.24, center_z - height * 0.20)
    groups["plaque"].append(add_box(
        f"Surface_{index:02d}_Catalogue_Plaque",
        (plaque_x, plaque_y, plaque_z),
        (0.075, 1.14, 0.80),
        materials["plaque"],
        bevel=0.025,
        theme_role="plaque",
    ))
    label = add_vertical_panel(
        f"CATALOGUE_LABEL_{index:02d}",
        side,
        ((-6.646 if side == "west" else 6.646), plaque_y, plaque_z),
        1.04,
        0.70,
        materials["plaque"],
    )
    label["theme_role"] = "catalogue_label"
    label["asset_id"] = f"artwork-{index:02d}"
    label["catalogue_label"] = True
    label["representation"] = "readable in-room catalogue label for a genuine artwork surface detail"
    for key, value in catalogue.items():
        label[key] = value
    label["source_asset"] = str((ROOT / "assets" / "artworks" / f"artwork-{index:02d}.jpg").relative_to(ROOT))

    panel = add_vertical_panel(
        f"SURFACE_DETAIL_{index:02d}",
        side,
        center,
        width,
        height,
        image_material,
    )
    panel["asset_role"] = "genuine_artwork_surface_detail"
    panel["asset_id"] = f"artwork-{index:02d}"
    panel["display_label"] = f"{catalogue['title']} · detail"
    panel["title"] = catalogue["title"]
    panel["year"] = catalogue["year"]
    panel["medium"] = catalogue["medium"]
    panel["dimensions"] = catalogue["dimensions"]
    panel["availability"] = catalogue["availability"]
    panel["description"] = catalogue["description"]
    panel["detail_label"] = f"Surface detail · {catalogue['medium']}"
    panel["source_asset"] = str((ROOT / "assets" / "artworks" / f"artwork-{index:02d}.jpg").relative_to(ROOT))
    panel["optimized_asset"] = str(image_path.relative_to(ROOT))
    panel["representation"] = "genuine macro/detail photograph; not a complete artwork view"
    panel["is_complete_artwork_view"] = False
    panel["catalogue_metadata_status"] = "verified against local website catalogue"
    panel["colour_locked"] = True
    panel["surface_index"] = index

    hotspot_x = -6.58 if side == "west" else 6.58
    hotspot = add_empty(
        f"HOTSPOT_Surface_{index:02d}",
        (hotspot_x, along_wall, center_z),
        display_type="SPHERE",
        display_size=0.16,
    )
    hotspot["navigation_role"] = "artwork_hotspot"
    hotspot["target_node"] = panel.name
    hotspot["asset_id"] = panel["asset_id"]
    hotspot["display_label"] = panel["display_label"]
    hotspot["representation"] = panel["representation"]
    for key in ("title", "year", "medium", "dimensions", "availability", "description", "detail_label", "source_asset"):
        hotspot[key] = panel[key]

    light_x = -4.85 if side == "west" else 4.85
    portal_light = add_light(
        f"Surface_Spot_{index:02d}",
        "SPOT",
        (light_x, along_wall, 5.20),
        center,
        (1.0, 0.73, 0.43) if index % 2 else (0.72, 0.83, 1.0),
        520 if index % 2 else 440,
        web=True,
        theme_role="surface_spot",
        spot_size=math.radians(33),
    )
    add_spot_fixture(portal_light, f"Surface_Spot_{index:02d}", materials, groups)

    view_x = -3.55 if side == "west" else 3.55
    add_view_anchor(
        f"VIEW_Surface_{index:02d}",
        (view_x, along_wall, WALK_EYE_HEIGHT),
        center,
        label=f"{catalogue['title']} · detail",
        kind="surface_detail",
        surface_index=index,
    )
    return panel


def add_site_information_panels(
    materials: dict[str, bpy.types.Material],
    groups: dict[str, list[bpy.types.Object]],
) -> None:
    """Build subtle south-wall boards used only by the optional 3D-site demo."""
    for index, (panel_data, x) in enumerate(zip(SITE_PANELS, (-5.15, -2.58, 0.0, 2.58, 5.15)), start=1):
        center_z = 2.42
        recess = add_box(
            f"SITE_PANEL_{index:02d}_Recess",
            (x, -7.84, center_z),
            (2.25, 0.10, 1.58),
            materials["shadow"],
            bevel=0.035,
            theme_role="shadow",
        )
        frame = add_box(
            f"SITE_PANEL_{index:02d}_Frame",
            (x, -7.72, center_z),
            (2.15, 0.10, 1.48),
            materials["bronze"],
            bevel=0.035,
            theme_role="bronze",
        )
        backing = add_box(
            f"SITE_PANEL_{index:02d}_Backing",
            (x, -7.655, center_z),
            (2.02, 0.055, 1.35),
            materials["plaque"],
            bevel=0.025,
            theme_role="plaque",
        )
        for structure in (recess, frame, backing):
            structure["demo_only"] = True
            structure["asset_role"] = "optional_3d_site_architecture"
        panel = add_vertical_panel(
            f"SITE_PANEL_{panel_data['id'].upper()}",
            "south",
            (x, -7.622, center_z),
            1.91,
            1.24,
            materials["plaque"],
        )
        panel["theme_role"] = "site_panel"
        panel["asset_id"] = f"site-panel-{panel_data['id']}"
        panel["site_panel_id"] = panel_data["id"]
        panel["site_title"] = panel_data["title"]
        panel["site_kicker"] = panel_data["kicker"]
        panel["site_body"] = panel_data["body"]
        panel["site_link"] = panel_data["link"]
        panel["site_link_label"] = panel_data["link_label"]
        panel["representation"] = "optional 3D-site information panel"
        panel["demo_only"] = True
        view = add_view_anchor(
            f"VIEW_Site_{index:02d}",
            (x, -5.25, WALK_EYE_HEIGHT),
            (x, -7.62, center_z),
            label=panel_data["title"],
            kind="site_panel",
        )
        view["target_node"] = panel.name
        view["demo_only"] = True


def add_site_navigation_console(materials: dict[str, bpy.types.Material]) -> None:
    """Build the optional website directory as a physical south-wall object."""
    backing = add_box(
        "SITE_NAVIGATION_Recess",
        (0, -7.82, 0.80),
        (6.82, 0.12, 0.86),
        materials["shadow"],
        bevel=0.045,
        theme_role="shadow",
    )
    frame = add_box(
        "SITE_NAVIGATION_Bronze_Frame",
        (0, -7.70, 0.80),
        (6.68, 0.10, 0.75),
        materials["bronze"],
        bevel=0.025,
        theme_role="bronze",
    )
    backing_inner = add_box(
        "SITE_NAVIGATION_Plaque",
        (0, -7.642, 0.80),
        (6.54, 0.045, 0.63),
        materials["plaque"],
        bevel=0.018,
        theme_role="plaque",
    )
    for structure in (backing, frame, backing_inner):
        structure["demo_only"] = True
        structure["asset_role"] = "optional_3d_site_navigation_architecture"

    navigation_items = [
        {"id": "artworks", "label": "Artworks"},
        *({"id": panel["id"], "label": panel["id"].title()} for panel in SITE_PANELS),
    ]
    console = add_vertical_panel(
        "SITE_NAVIGATION_CONSOLE",
        "south",
        (0, -7.616, 0.80),
        6.38,
        0.51,
        materials["plaque"],
    )
    console["theme_role"] = "site_navigation"
    console["asset_id"] = "site-navigation-console"
    console["site_navigation"] = True
    console["site_navigation_items_json"] = json.dumps(navigation_items, separators=(",", ":"))
    console["representation"] = "interactive physical navigation directory"
    console["demo_only"] = True

    view = add_view_anchor(
        "VIEW_Site_Directory",
        (0, -1.35, WALK_EYE_HEIGHT),
        (0, -7.616, 0.80),
        label="3D site directory",
        kind="site_navigation",
    )
    view["target_node"] = console.name
    view["demo_only"] = True


def add_stem_between(
    name: str,
    start: Vector,
    end: Vector,
    radius: float,
    material: bpy.types.Material,
    group: list[bpy.types.Object],
) -> bpy.types.Object:
    direction = end - start
    stem = add_cylinder(name, tuple((start + end) / 2), radius, direction.length, material, vertices=8)
    stem.rotation_mode = "QUATERNION"
    stem.rotation_quaternion = direction.to_track_quat("Z", "Y")
    stem["asset_role"] = "decorative_botanical"
    group.append(stem)
    return stem


def add_leaf(
    name: str,
    location: Vector,
    size: float,
    rotation: tuple[float, float, float],
    material: bpy.types.Material,
    group: list[bpy.types.Object],
) -> bpy.types.Object:
    # Irregular lanceolate profile: narrow enough to read as a dried leaf,
    # with small out-of-plane offsets so the silhouette catches grazing light.
    width = size * 0.18
    vertices = [
        (0.0, 0.0, 0.0),
        (-width * 0.34, 0.008, size * 0.12),
        (-width * 0.74, 0.022, size * 0.34),
        (-width, 0.036, size * 0.54),
        (-width * 0.66, 0.018, size * 0.77),
        (-width * 0.30, 0.004, size * 0.91),
        (0.0, -0.012, size),
        (width * 0.28, -0.004, size * 0.90),
        (width * 0.62, -0.020, size * 0.75),
        (width * 0.91, -0.038, size * 0.51),
        (width * 0.68, -0.020, size * 0.31),
        (width * 0.30, -0.006, size * 0.10),
    ]
    mesh = bpy.data.meshes.new(f"{name}_Mesh")
    mesh.from_pydata(vertices, [], [tuple(range(len(vertices)))])
    mesh.update()
    leaf = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(leaf)
    leaf.location = location
    leaf.rotation_euler = rotation
    assign_material(leaf, material)
    solidify = leaf.modifiers.new("Dried leaf thickness", "SOLIDIFY")
    solidify.thickness = 0.006
    solidify.offset = 0.0
    bevel = leaf.modifiers.new("Soft leaf edge", "BEVEL")
    bevel.width = 0.004
    bevel.segments = 2
    leaf["asset_role"] = "decorative_botanical"
    mark_web(leaf)
    group.append(leaf)
    return leaf


def add_seed_head(
    name: str,
    start: Vector,
    end: Vector,
    material: bpy.types.Material,
    group: list[bpy.types.Object],
) -> bpy.types.Object:
    direction = end - start
    bpy.ops.mesh.primitive_ico_sphere_add(
        subdivisions=2,
        radius=1.0,
        location=tuple(end + direction.normalized() * 0.075),
    )
    seed = bpy.context.object
    seed.name = name
    seed.rotation_mode = "QUATERNION"
    seed.rotation_quaternion = direction.to_track_quat("Z", "Y")
    seed.scale = (0.042, 0.042, 0.115)
    assign_material(seed, material)
    seed["asset_role"] = "decorative_dried_seed_head"
    mark_web(seed)
    group.append(seed)
    return seed


def add_botanical(
    prefix: str,
    origin: tuple[float, float, float],
    materials: dict[str, bpy.types.Material],
    groups: dict[str, list[bpy.types.Object]],
    seed: int,
) -> None:
    random.seed(seed)
    x, y, _ = origin
    planter = add_cylinder(f"{prefix}_Planter", (x, y, 0.49), 0.43, 0.98, materials["planter"], vertices=28)
    planter["theme_role"] = "planter"
    planter_bevel = planter.modifiers.new("Ceramic rolled edge", "BEVEL")
    planter_bevel.width = 0.045
    planter_bevel.segments = 3
    groups["planter"].append(planter)
    foot = add_cylinder(f"{prefix}_Planter_Foot", (x, y, 0.055), 0.31, 0.08, materials["bronze"], vertices=28)
    foot["theme_role"] = "bronze"
    groups["bronze"].append(foot)
    rim = add_torus(f"{prefix}_Planter_Rim", (x, y, 0.99), 0.425, 0.045, materials["bronze"])
    rim["theme_role"] = "bronze"
    groups["bronze"].append(rim)
    soil = add_cylinder(f"{prefix}_Planter_Shadowed_Soil", (x, y, 0.965), 0.385, 0.025, materials["shadow"], vertices=28)
    soil["theme_role"] = "shadow"
    groups["shadow"].append(soil)

    base = Vector((x, y, 0.91))
    for index in range(8):
        angle = random.uniform(-1.05, 1.05)
        end = Vector((
            x + math.sin(angle) * random.uniform(0.38, 0.86),
            y + random.uniform(-0.36, 0.34),
            random.uniform(2.35, 3.75),
        ))
        middle = base.lerp(end, 0.54)
        middle.x += random.uniform(-0.16, 0.16)
        add_stem_between(
            f"{prefix}_Stem_{index:02d}_A",
            base,
            middle,
            random.uniform(0.012, 0.022),
            materials["stem"],
            groups["stem"],
        )
        add_stem_between(
            f"{prefix}_Stem_{index:02d}_B",
            middle,
            end,
            random.uniform(0.009, 0.017),
            materials["stem"],
            groups["stem"],
        )
        add_seed_head(
            f"{prefix}_Seed_{index:02d}",
            middle,
            end,
            materials["leaf_a"] if index % 3 else materials["leaf_b"],
            groups["leaf_a"] if index % 3 else groups["leaf_b"],
        )
        for leaf_index, factor in enumerate((0.46, 0.65, 0.82)):
            position = base.lerp(end, factor)
            side = -1 if (index + leaf_index) % 2 else 1
            add_leaf(
                f"{prefix}_Leaf_{index:02d}_{leaf_index:02d}",
                position,
                random.uniform(0.38, 0.60),
                (
                    random.uniform(-0.28, 0.35),
                    random.uniform(-0.42, 0.42),
                    angle + side * random.uniform(0.62, 1.12),
                ),
                materials["leaf_a"] if (index + leaf_index) % 3 else materials["leaf_b"],
                groups["leaf_a"] if (index + leaf_index) % 3 else groups["leaf_b"],
            )


def build_gallery_shell(
    materials: dict[str, bpy.types.Material],
    groups: dict[str, list[bpy.types.Object]],
) -> None:
    wall_thickness = 0.30
    groups["wall"].extend([
        add_box("Room_North_Wall", (0, ROOM_HALF_DEPTH, ROOM_HEIGHT / 2), (14.0, wall_thickness, ROOM_HEIGHT), materials["wall"], theme_role="wall"),
        add_box("Room_South_Wall", (0, -ROOM_HALF_DEPTH, ROOM_HEIGHT / 2), (14.0, wall_thickness, ROOM_HEIGHT), materials["wall"], theme_role="wall"),
        add_box("Room_West_Wall", (-ROOM_HALF_WIDTH, 0, ROOM_HEIGHT / 2), (wall_thickness, 16.0, ROOM_HEIGHT), materials["wall"], theme_role="wall"),
        add_box("Room_East_Wall", (ROOM_HALF_WIDTH, 0, ROOM_HEIGHT / 2), (wall_thickness, 16.0, ROOM_HEIGHT), materials["wall"], theme_role="wall"),
    ])
    groups["ceiling"].append(add_box(
        "Room_Ceiling",
        (0, 0, ROOM_HEIGHT + 0.12),
        (14.0, 16.0, 0.24),
        materials["ceiling"],
        theme_role="ceiling",
    ))
    groups["floor"].append(add_box(
        "Room_Floor",
        (0, 0, -0.10),
        (14.0, 16.0, 0.20),
        materials["floor"],
        theme_role="floor",
    ))

    # Continuous skirting and ceiling shadow gaps give the architecture real
    # construction joints and stronger contact shadows.
    for name, location, dimensions in (
        ("Skirting_West", (-6.76, 0, 0.14), (0.12, 15.55, 0.24)),
        ("Skirting_East", (6.76, 0, 0.14), (0.12, 15.55, 0.24)),
        ("Skirting_North", (0, 7.76, 0.14), (13.45, 0.12, 0.24)),
        ("Skirting_South", (0, -7.76, 0.14), (13.45, 0.12, 0.24)),
    ):
        groups["stone"].append(add_box(name, location, dimensions, materials["stone"], bevel=0.018, theme_role="stone"))
    for name, location, dimensions in (
        ("Ceiling_Gap_West", (-6.73, 0, 5.50), (0.07, 15.40, 0.07)),
        ("Ceiling_Gap_East", (6.73, 0, 5.50), (0.07, 15.40, 0.07)),
        ("Ceiling_Gap_North", (0, 7.70, 5.50), (13.40, 0.07, 0.07)),
        ("Ceiling_Gap_South", (0, -7.70, 5.50), (13.40, 0.07, 0.07)),
    ):
        groups["shadow"].append(add_box(name, location, dimensions, materials["shadow"], bevel=0.01, theme_role="shadow"))

    # Individually beveled honed-stone slabs catch grazing light and create
    # real highlight breaks. The slightly recessed base reads as dark grout.
    tile_width = 2.72
    tile_depth = 1.53
    for row in range(10):
        for column in range(5):
            x = -5.52 + column * 2.76
            y = -6.92 + row * 1.54
            group_name = "floor_tile_a" if (row + column) % 2 else "floor_tile_b"
            groups[group_name].append(add_box(
                f"Floor_Tile_{row + 1:02d}_{column + 1:02d}",
                (x, y, 0.008),
                (tile_width, tile_depth, 0.045),
                materials[group_name],
                bevel=0.016,
                theme_role=group_name,
            ))

    # Large stone bays give the side-wall details architectural rhythm.
    for side, x in (("West", -6.82), ("East", 6.82)):
        # Dividers sit in the clear gaps between portal extents. Keeping this
        # datum exact prevents architecture from crossing genuine images.
        for bay_index, y in enumerate((-6.55, -2.70, 1.57, 5.60), start=1):
            groups["stone"].append(add_box(
                f"{side}_Pilaster_{bay_index}",
                (x, y, 2.90),
                (0.28, 0.30, 5.36),
                materials["stone"],
                bevel=0.025,
                theme_role="stone",
            ))

    # Polished path, bronze datum and ceiling rails make the room feel built.
    groups["floor_alt"].append(add_box(
        "Floor_Central_Run",
        (0, 0.25, 0.015),
        (3.15, 14.1, 0.035),
        materials["floor_alt"],
        bevel=0.012,
        theme_role="floor_alt",
    ))
    for x in (-1.62, 1.62):
        groups["bronze"].append(add_box(
            f"Floor_Bronze_Inlay_{x:+.0f}",
            (x, 0.25, 0.039),
            (0.028, 14.1, 0.012),
            materials["bronze"],
            theme_role="bronze",
        ))
    for x in (-4.90, 0.0, 4.90):
        groups["shadow"].append(add_box(
            f"Ceiling_Track_{x:+.0f}",
            (x, 0.20, 5.57),
            (0.065, 13.8, 0.065),
            materials["shadow"],
            bevel=0.012,
            theme_role="shadow",
        ))

    # South threshold closes the room and rewards a full turn behind the visitor.
    groups["shadow"].append(add_box(
        "Threshold_Recess",
        (0, -7.82, 2.88),
        (3.40, 0.10, 4.72),
        materials["shadow"],
        bevel=0.04,
        theme_role="shadow",
    ))
    for x in (-1.78, 1.78):
        groups["bronze"].append(add_box(
            f"Threshold_Frame_{x:+.0f}",
            (x, -7.70, 2.86),
            (0.08, 0.14, 4.88),
            materials["bronze"],
            bevel=0.014,
            theme_role="bronze",
        ))
    groups["emissive"].append(add_box(
        "Threshold_Light_Slit",
        (0, -7.70, 2.88),
        (0.045, 0.12, 3.72),
        materials["emissive"],
        bevel=0.01,
        theme_role="emissive",
    ))
    threshold_light = add_light(
        "Threshold_Spot",
        "SPOT",
        (0, -4.92, 5.18),
        (0, -7.70, 2.54),
        (1.0, 0.73, 0.45),
        330,
        web=True,
        theme_role="threshold_spot",
        spot_size=math.radians(42),
        spot_blend=0.70,
    )
    add_spot_fixture(threshold_light, "Threshold_Spot", materials, groups)


def add_wartrobe(
    materials: dict[str, bpy.types.Material],
    groups: dict[str, list[bpy.types.Object]],
) -> bpy.types.Object:
    surface_material, ratio = create_image_material(
        "WARTROBE_GENUINE_FRONT_LOCKED",
        WARTROBE_TEXTURE,
        role="wartrobe_surface_locked",
        maximum_edge=1200,
        emission_strength=0.045,
    )
    height = 3.12
    width = height * ratio
    center_z = 2.52

    groups["shadow"].append(add_box(
        "WARTROBE_Architectural_Recess",
        (0, 7.82, 2.85),
        (4.75, 0.14, 4.88),
        materials["shadow"],
        bevel=0.055,
        theme_role="shadow",
    ))
    groups["wartrobe_shadow"].append(add_box(
        "WARTROBE_Carcass",
        (0, 7.62, center_z),
        (width + 0.28, 0.42, height + 0.28),
        materials["shadow"],
        bevel=0.035,
        theme_role="shadow",
    ))
    frame_depth = 0.13
    bar = 0.065
    for suffix, x, z, dimensions in (
        ("Bottom", 0, center_z - height / 2 - bar / 2, (width + bar * 2, frame_depth, bar)),
        ("Top", 0, center_z + height / 2 + bar / 2, (width + bar * 2, frame_depth, bar)),
        ("Left", -width / 2 - bar / 2, center_z, (bar, frame_depth, height + bar * 2)),
        ("Right", width / 2 + bar / 2, center_z, (bar, frame_depth, height + bar * 2)),
    ):
        groups["wartrobe_bronze"].append(add_box(
            f"WARTROBE_Frame_{suffix}",
            (x, 7.42, z),
            dimensions,
            materials["bronze"],
            bevel=0.012,
            theme_role="bronze",
        ))

    surface = add_vertical_panel(
        "WARTROBE_Genuine_Front",
        "north",
        (0, 7.405, center_z),
        width,
        height,
        surface_material,
    )
    surface["asset_role"] = "genuine_wartrobe_complete_front_photograph"
    surface["asset_id"] = "wartrobe-front"
    surface["display_label"] = "wARTrobe · Front"
    surface["source_asset"] = "assets/gallery/gallery-04.jpg"
    surface["optimized_asset"] = str(WARTROBE_TEXTURE.relative_to(ROOT))
    surface["representation"] = "genuine complete front photograph on modeled spatial object; room is not a scan"
    surface["is_complete_object_view"] = True
    surface["colour_locked"] = True
    surface["title"] = "wARTrobe · Front"
    surface["year"] = "One-of-one object"
    surface["medium"] = "Painted wardrobe installation"
    surface["dimensions"] = "Details on request"
    surface["availability"] = "Private inquiry"
    surface["description"] = "A painted object where storage, memory, and surface become one architectural presence."

    hotspot = add_empty("HOTSPOT_wARTrobe", (0, 7.17, center_z), display_type="SPHERE", display_size=0.20)
    hotspot["navigation_role"] = "artwork_hotspot"
    hotspot["target_node"] = surface.name
    hotspot["asset_id"] = "wartrobe-front"
    hotspot["display_label"] = "wARTrobe · Front"
    hotspot["representation"] = surface["representation"]
    for key in ("title", "year", "medium", "dimensions", "availability", "description", "source_asset"):
        hotspot[key] = surface[key]

    for index, x in enumerate((-1.20, 1.20), start=1):
        wartrobe_light = add_light(
            f"WARTROBE_Spot_{index}",
            "SPOT",
            (x, 4.75, 5.28),
            (x * 0.32, 7.40, 2.38),
            (1.0, 0.70, 0.38),
            710,
            web=True,
            theme_role="wartrobe_spot",
            spot_size=math.radians(31),
        )
        add_spot_fixture(wartrobe_light, f"WARTROBE_Spot_{index}", materials, groups)

    add_view_anchor(
        "VIEW_wARTrobe",
        (0, 3.58, WALK_EYE_HEIGHT),
        (0, 7.40, 2.48),
        label="wARTrobe · Front",
        kind="focal_object",
    )["target_node"] = surface.name
    return surface


def add_bench(materials: dict[str, bpy.types.Material], groups: dict[str, list[bpy.types.Object]]) -> None:
    # Tailored leather cushion over a warm walnut apron and slim patinated
    # brass legs. The layered silhouette reads as furniture, not stacked cubes.
    groups["leather"].append(add_box(
        "Bench_Leather_Cushion",
        (0, -2.55, 0.61),
        (3.24, 0.86, 0.20),
        materials["leather"],
        bevel=0.095,
        theme_role="leather",
    ))
    groups["wood"].append(add_box(
        "Bench_Walnut_Apron",
        (0, -2.55, 0.46),
        (3.02, 0.67, 0.18),
        materials["wood"],
        bevel=0.045,
        theme_role="wood",
    ))
    for y in (-2.95, -2.15):
        groups["leather_seam"].append(add_box(
            f"Bench_Leather_Piping_{y:+.2f}",
            (0, y, 0.665),
            (3.10, 0.018, 0.018),
            materials["leather_seam"],
            bevel=0.007,
            theme_role="leather_seam",
        ))
    for x in (-1.25, 1.25):
        groups["bronze"].append(add_box(
            f"Bench_Leg_{x:+.2f}",
            (x, -2.55, 0.245),
            (0.105, 0.60, 0.43),
            materials["bronze"],
            bevel=0.032,
            theme_role="bronze",
        ))
        groups["bronze"].append(add_box(
            f"Bench_Leg_Foot_{x:+.2f}",
            (x, -2.55, 0.055),
            (0.31, 0.67, 0.055),
            materials["bronze"],
            bevel=0.018,
            theme_role="bronze",
        ))


def add_navigation_metadata(scene: bpy.types.Scene) -> None:
    xmin, xmax, ymin, ymax = WALK_BOUNDS
    start = add_empty("Walk_Start", (0, -6.42, WALK_EYE_HEIGHT), display_type="ARROWS", display_size=0.42)
    target = add_empty("Walk_LookTarget", (0, 7.38, 2.50), display_type="SPHERE", display_size=0.22)
    look_at(start, target.location)
    start["navigation_role"] = "walk_start"
    start["look_target_node"] = target.name
    start["eye_height"] = WALK_EYE_HEIGHT
    target["navigation_role"] = "look_target"

    bounds_min = add_empty("Walk_Bounds_Min", (xmin, ymin, 0), display_type="CUBE", display_size=0.18)
    bounds_max = add_empty("Walk_Bounds_Max", (xmax, ymax, WALK_EYE_HEIGHT), display_type="CUBE", display_size=0.18)
    bounds_min["navigation_role"] = "bounds_min"
    bounds_max["navigation_role"] = "bounds_max"
    bounds_min["three_xz"] = [xmin, -ymin]
    bounds_max["three_xz"] = [xmax, -ymax]

    add_view_anchor(
        "VIEW_Entrance",
        tuple(start.location),
        tuple(target.location),
        label="Entrance",
        kind="entrance",
    )
    add_view_anchor(
        "VIEW_Overview",
        (0, -0.55, 1.92),
        (0, 7.38, 2.45),
        label="Gallery overview",
        kind="overview",
    )

    add_collider("COLLIDER_Wall_North", (0, 7.82, ROOM_HEIGHT / 2), (14.0, 0.36, ROOM_HEIGHT))
    add_collider("COLLIDER_Wall_South", (0, -7.82, ROOM_HEIGHT / 2), (14.0, 0.36, ROOM_HEIGHT))
    add_collider("COLLIDER_Wall_West", (-6.82, 0, ROOM_HEIGHT / 2), (0.36, 16.0, ROOM_HEIGHT))
    add_collider("COLLIDER_Wall_East", (6.82, 0, ROOM_HEIGHT / 2), (0.36, 16.0, ROOM_HEIGHT))
    add_collider("COLLIDER_Bench", (0, -2.55, 0.45), (3.45, 1.04, 0.90))
    add_collider("COLLIDER_wARTrobe", (0, 7.35, 2.52), (2.75, 0.74, 3.50))
    add_collider("COLLIDER_Plant_West", (-5.40, 6.20, 0.64), (1.15, 1.15, 1.28))
    add_collider("COLLIDER_Plant_East", (5.40, 6.20, 0.64), (1.15, 1.15, 1.28))

    scene["navigation_type"] = "bounded_walkable_gallery"
    scene["walk_start_node"] = start.name
    scene["walk_look_target_node"] = target.name
    scene["walk_bounds_min_node"] = bounds_min.name
    scene["walk_bounds_max_node"] = bounds_max.name
    scene["walk_bounds_blender_xy"] = [xmin, xmax, ymin, ymax]
    scene["walk_bounds_three_xz"] = [xmin, xmax, -ymax, -ymin]
    scene["eye_height_metres"] = WALK_EYE_HEIGHT
    scene["movement_speed_metres_per_second"] = 1.5
    scene["collision_padding_metres"] = 0.34
    scene["coordinate_note"] = "Blender XYZ maps to glTF/Three X,Y,Z as X,Z,-Y"


def create_preview_camera(scene: bpy.types.Scene) -> None:
    camera_data = bpy.data.cameras.new("Gallery Preview Camera")
    camera = bpy.data.objects.new("Gallery_Preview_Camera", camera_data)
    bpy.context.collection.objects.link(camera)
    camera.location = (0, -6.35, 1.82)
    camera_data.sensor_width = 36.0
    camera_data.lens = 25.0
    camera_data.clip_start = 0.05
    camera_data.clip_end = 70.0
    look_at(camera, Vector((0, 7.38, 2.42)))
    camera["camera_role"] = "non_authoritative_preview"
    mark_web(camera)
    scene.camera = camera


def optimize_groups(groups: dict[str, list[bpy.types.Object]]) -> None:
    roles = {
        "wall": "wall",
        "ceiling": "ceiling",
        "floor": "floor",
        "floor_tile_a": "floor_tile_a",
        "floor_tile_b": "floor_tile_b",
        "floor_alt": "floor_alt",
        "stone": "stone",
        "bronze": "bronze",
        "shadow": "shadow",
        "emissive": "emissive",
        "bench": "bench",
        "wood": "wood",
        "leather": "leather",
        "leather_seam": "leather_seam",
        "planter": "planter",
        "plaque": "plaque",
        "plaque_text": "plaque_text",
        "stem": "botanical_stem",
        "leaf_a": "botanical_leaf",
        "leaf_b": "botanical_leaf",
        "wartrobe_shadow": "shadow",
        "wartrobe_bronze": "bronze",
    }
    for group_name, role in roles.items():
        join_meshes(f"ARCH_{group_name.title()}", groups[group_name], theme_role=role)


def build_scene() -> bpy.types.Scene:
    clean_scene()
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    for source in [WARTROBE_TEXTURE, *SURFACE_TEXTURES, *MATERIAL_TEXTURES.values()]:
        if not source.exists():
            raise FileNotFoundError(f"Missing required genuine image: {source}")

    scene = bpy.context.scene
    scene.name = "Danny Hirsch Arts — Bounded 360 Gallery"
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_x = 1600
    scene.render.resolution_y = 900
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.film_transparent = False
    scene.view_settings.look = "AgX - Medium High Contrast"
    scene.view_settings.exposure = -0.48

    world = bpy.data.worlds.new("Gallery Atmosphere")
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs["Color"].default_value = rgba("#070908")
    world.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.16
    scene.world = world

    materials = {
        "wall": create_material("Gallery_Wall", "#181a19", "#b9b0a4", "wall", roughness=0.86),
        "stone": create_material("Gallery_Stone", "#101211", "#8f887e", "stone", roughness=0.58, metallic=0.03),
        "ceiling": create_material("Gallery_Ceiling", "#090b0a", "#8a8276", "ceiling", roughness=0.70),
        "floor": create_material("Gallery_Grout", "#090a08", "#5f594f", "floor", roughness=0.72, metallic=0.0),
        "floor_tile_a": create_textured_material("Gallery_Honed_Stone_A", MATERIAL_TEXTURES["limestone"], "#8b867d", "#c2bbb0", "floor_tile_a", roughness=0.25, metallic=0.02, clearcoat=0.28, clearcoat_roughness=0.18),
        "floor_tile_b": create_textured_material("Gallery_Honed_Stone_B", MATERIAL_TEXTURES["limestone"], "#6f706b", "#aaa49a", "floor_tile_b", roughness=0.31, metallic=0.02, clearcoat=0.20, clearcoat_roughness=0.22),
        "floor_alt": create_textured_material("Gallery_Floor_Alt", MATERIAL_TEXTURES["limestone"], "#979185", "#c5bcae", "floor_alt", roughness=0.20, metallic=0.04, clearcoat=0.38, clearcoat_roughness=0.15),
        "shadow": create_material("Gallery_Shadow", "#030504", "#4c4943", "shadow", roughness=0.76),
        "bronze": create_material("Gallery_Patinated_Bronze", "#634922", "#866331", "bronze", roughness=0.21, metallic=0.90, clearcoat=0.16, clearcoat_roughness=0.18),
        "bench": create_material("Gallery_Bench", "#17140f", "#7c7162", "bench", roughness=0.42),
        "wood": create_textured_material("Gallery_Walnut", MATERIAL_TEXTURES["walnut"], "#76553d", "#ab8d73", "wood", roughness=0.29, clearcoat=0.26, clearcoat_roughness=0.18),
        "leather": create_textured_material("Gallery_Saddle_Leather", MATERIAL_TEXTURES["leather"], "#6a5a4d", "#9b8b7c", "leather", roughness=0.40, clearcoat=0.10, clearcoat_roughness=0.30),
        "leather_seam": create_material("Gallery_Leather_Piping", "#090806", "#403931", "leather_seam", roughness=0.46),
        "planter": create_material("Gallery_Glazed_Ceramic", "#211f1a", "#91887c", "planter", roughness=0.24, metallic=0.02, clearcoat=0.58, clearcoat_roughness=0.12),
        "plaque": create_material("Gallery_Catalogue_Plaque", "#b5aa97", "#ded5c6", "plaque", roughness=0.30, metallic=0.02, clearcoat=0.20, clearcoat_roughness=0.18),
        "plaque_text": create_material("Gallery_Plaque_Engraving", "#2c241a", "#3b3023", "plaque_text", roughness=0.38, metallic=0.58),
        "stem": create_material("Botanical_Stem", "#38291b", "#604b35", "botanical_stem", roughness=0.88),
        "leaf_a": create_material("Botanical_Leaf_Ochre", "#8a5e32", "#9b744b", "botanical_leaf", roughness=0.92),
        "leaf_b": create_material("Botanical_Leaf_Smoke", "#6d5940", "#806b50", "botanical_leaf", roughness=0.94),
        "emissive": create_material(
            "Gallery_Warm_Aperture",
            "#8b6128",
            "#9d6f35",
            "emissive",
            roughness=0.24,
            metallic=0.12,
            emission="#d9aa61",
            emission_strength=3.4,
        ),
    }
    groups = {name: [] for name in (
        "wall", "stone", "ceiling", "floor", "floor_tile_a", "floor_tile_b", "floor_alt", "shadow", "bronze",
        "emissive", "bench", "wood", "leather", "leather_seam", "planter", "plaque", "plaque_text", "stem", "leaf_a", "leaf_b",
        "wartrobe_shadow", "wartrobe_bronze",
    )}

    build_gallery_shell(materials, groups)
    add_bench(materials, groups)
    add_wartrobe(materials, groups)

    portal_layout = [
        (1, "west", -4.82),
        (2, "west", -0.58),
        (3, "west", 3.72),
        (4, "east", 3.72),
        (5, "east", -0.58),
        (6, "east", -4.82),
    ]
    for index, side, along_wall in portal_layout:
        add_surface_portal(index, side, along_wall, SURFACE_TEXTURES[index - 1], materials, groups)

    add_site_information_panels(materials, groups)
    add_site_navigation_console(materials)

    add_botanical("Botanical_West", (-5.40, 6.20, 0), materials, groups, seed=1963)
    add_botanical("Botanical_East", (5.40, 6.20, 0), materials, groups, seed=2026)
    for side, x in (("West", -5.40), ("East", 5.40)):
        botanical_light = add_light(
            f"Botanical_Spot_{side}",
            "SPOT",
            (x * 0.82, 4.25, 5.15),
            (x, 6.20, 2.05),
            (1.0, 0.67, 0.36),
            210,
            web=True,
            theme_role="botanical_spot",
            spot_size=math.radians(32),
            spot_blend=0.72,
        )
        add_spot_fixture(botanical_light, f"Botanical_Spot_{side}", materials, groups)
    add_navigation_metadata(scene)
    create_preview_camera(scene)

    # Broad render-only fill gives the .blend a useful authored preview while
    # the exported GLB retains its lean punctual-light rig.
    add_light(
        "Render_Ambient_Key",
        "AREA",
        (-2.8, -1.8, 5.15),
        (0, 3.8, 2.4),
        (1.0, 0.72, 0.48),
        980,
        web=False,
        theme_role="render_only",
    )
    add_light(
        "Render_Ambient_Fill",
        "AREA",
        (4.5, -0.8, 4.35),
        (0, 3.0, 2.2),
        (0.35, 0.50, 0.72),
        520,
        web=False,
        theme_role="render_only",
    )
    add_light(
        "Gallery_Ambient_Fill",
        "POINT",
        (0, -0.65, 4.55),
        (0, 2.4, 2.2),
        (0.74, 0.78, 0.76),
        58,
        web=True,
        theme_role="ambient_fill",
    )

    optimize_groups(groups)

    scene["experience_name"] = "Danny Hirsch Arts — Material Orbit"
    scene["experience_version"] = 3
    scene["architecture_truth"] = "Blender-modeled spatial interpretation; not a 3D scan"
    scene["artwork_truth"] = "Six portals are genuine surface-detail photographs, not complete work simulations"
    scene["wartrobe_truth"] = "wARTrobe focal surface uses genuine complete front photograph gallery-04"
    scene["surface_count"] = 6
    scene["catalogue_label_count"] = 6
    scene["site_demo_panel_count"] = len(SITE_PANELS)
    scene["site_navigation_embedded"] = True
    scene["generated_room_materials_json"] = json.dumps({
        key: str(path.relative_to(ROOT)) for key, path in MATERIAL_TEXTURES.items()
    }, separators=(",", ":"))
    scene["view_anchor_prefix"] = "VIEW_"
    scene["collider_prefix"] = "COLLIDER_"
    scene["hotspot_prefix"] = "HOTSPOT_"
    scene["theme_palette_json"] = json.dumps({
        key: {"dark": material["theme_dark"], "light": material["theme_light"]}
        for key, material in materials.items()
        if "theme_dark" in material and "theme_light" in material
    }, separators=(",", ":"))
    return scene


def export_glb(scene: bpy.types.Scene) -> None:
    bpy.ops.object.select_all(action="DESELECT")
    selected = []
    for obj in scene.objects:
        if obj.get("web_export"):
            obj.select_set(True)
            selected.append(obj)
    if not selected:
        raise RuntimeError("No web-export objects were created")
    bpy.context.view_layer.objects.active = next((obj for obj in selected if obj.type == "MESH"), selected[0])
    bpy.ops.export_scene.gltf(
        filepath=str(GLB_PATH),
        export_format="GLB",
        use_selection=True,
        export_cameras=True,
        export_lights=True,
        export_extras=True,
        export_animations=False,
        export_image_format="WEBP",
        export_image_quality=72,
        export_image_webp_fallback=False,
        export_materials="EXPORT",
        export_texcoords=True,
        export_normals=True,
        export_tangents=False,
        export_yup=True,
        export_apply=False,
        check_existing=False,
    )


def main() -> None:
    bpy.context.preferences.filepaths.save_version = 0
    scene = build_scene()
    bpy.ops.wm.save_as_mainfile(filepath=str(BLEND_PATH), compress=True)
    export_glb(scene)
    mesh_count = sum(1 for obj in scene.objects if obj.get("web_export") and obj.type == "MESH")
    node_count = sum(1 for obj in scene.objects if obj.get("web_export"))
    print(f"BLEND={BLEND_PATH}")
    print(f"GLB={GLB_PATH}")
    print(f"WEB_NODES={node_count}")
    print(f"WEB_MESHES={mesh_count}")


if __name__ == "__main__":
    main()
