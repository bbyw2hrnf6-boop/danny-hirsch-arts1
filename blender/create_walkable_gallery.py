"""Build the bounded Danny Hirsch Arts 360 gallery for the web.

Run from the repository root:

    /Applications/Blender.app/Contents/MacOS/Blender \
      --background --factory-startup \
      --python blender/create_walkable_gallery.py

The architecture is a designed spatial interpretation, not a scan.  The
wARTrobe uses the genuine complete front photograph.  The six side apertures
use genuine macro/detail photographs and are deliberately labelled in glTF
extras as surface details, never as complete artwork simulations. Optional
site-information displays carry the existing About, Process, Inquiry and legal
copy.  The legal displays are designed as reading lecterns, not wall signage.
"""

from __future__ import annotations

import json
import math
import random
from pathlib import Path
from typing import Iterable

import bpy
from mathutils import Quaternion, Vector


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
    "black_marble": ROOT / "assets" / "materials" / "black-marble-gallery.webp",
    "mineral_fabric": ROOT / "assets" / "materials" / "mineral-fabric-charcoal.webp",
    "walnut": ROOT / "assets" / "materials" / "smoked-walnut.webp",
    "leather": ROOT / "assets" / "materials" / "saddle-leather.webp",
}

# Approved material board, July 2026. These values are deliberately kept in
# one authoring source so Blender, the exported glTF extras and future visual
# audits describe the same physical palette.
MATERIAL_BOARD_PRESETS = {
    "rough_plaster": {"hex": "#3A3631", "roughness": 0.85, "specular": 0.30},
    "dark_walnut": {"hex": "#4A3222", "roughness": 0.45, "specular": 0.20},
    "dark_leather": {"hex": "#1E1B19", "roughness": 0.70, "specular": 0.25},
    "black_marble": {
        "hex": "#0F0F10",
        "roughness": 0.15,
        "specular": 0.50,
        "clearcoat": 0.30,
    },
    "brushed_bronze": {
        "hex": "#B08A4E",
        "roughness": 0.25,
        "specular": 0.50,
        "metallic": 1.0,
        "anisotropic": 0.60,
    },
    "matte_black": {"hex": "#1C1C1C", "roughness": 0.60, "specular": 0.20},
    "clear_glass": {"hex": "#FFFFFF", "roughness": 0.05, "specular": 0.50},
    "concrete_planter": {"hex": "#5C5C55", "roughness": 0.82, "specular": 0.22},
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
WALK_EYE_HEIGHT = 1.80
CURATED_EYE_HEIGHT = 1.88
STANDARD_ARTWORK_SCALE = 0.82
WALK_BOUNDS = (-6.20, 6.20, -15.30, 6.62)  # xmin, xmax, ymin, ymax in Blender XY.

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
    specular: float = 0.5,
    anisotropic: float = 0.0,
) -> bpy.types.Material:
    material = bpy.data.materials.new(name)
    material.use_nodes = True
    principled = material.node_tree.nodes.get("Principled BSDF")
    set_socket(principled, "Base Color", rgba(dark_color))
    set_socket(principled, "Roughness", roughness)
    set_socket(principled, "Metallic", metallic)
    set_socket(principled, "Specular IOR Level", specular)
    set_socket(principled, "Specular", specular)
    set_socket(principled, "Anisotropic IOR Level", anisotropic)
    set_socket(principled, "Anisotropic", anisotropic)
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
    material["web_specular"] = specular
    material["web_anisotropic"] = anisotropic
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
    uv_repeat: float = 1.0,
    specular: float = 0.5,
    anisotropic: float = 0.0,
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
        specular=specular,
        anisotropic=anisotropic,
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
    material["uv_repeat"] = uv_repeat
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
        repeat = float(material.get("uv_repeat", 1.0))
        for uv in obj.data.uv_layers.active.data:
            uv.uv.x = (uv.uv.x - 0.5) * mirror * repeat + 0.5 + offset_u
            uv.uv.y = (uv.uv.y - 0.5) * repeat + 0.5 + offset_v
    if bevel:
        modifier = obj.modifiers.new("Architectural edge", "BEVEL")
        modifier.width = bevel
        modifier.segments = 3 if bevel >= 0.018 else 2
        if hasattr(modifier, "harden_normals"):
            modifier.harden_normals = True
        # Smooth faces plus weighted corner normals remove the low-poly box
        # look while retaining crisp architectural planes after batching.
        for polygon in obj.data.polygons:
            polygon.use_smooth = True
        try:
            weighted = obj.modifiers.new("Weighted corner normals", "WEIGHTED_NORMAL")
            weighted.keep_sharp = True
            weighted.weight = 50
        except (RuntimeError, TypeError, AttributeError):
            obj["weighted_normals_fallback"] = "bevel_harden_normals"
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


def add_sphere(
    name: str,
    location: tuple[float, float, float],
    scale: tuple[float, float, float],
    material: bpy.types.Material,
    *,
    segments: int = 20,
    ring_count: int = 12,
) -> bpy.types.Object:
    """Create a smooth, economical ellipsoid for furniture and foliage."""
    bpy.ops.mesh.primitive_uv_sphere_add(
        segments=segments,
        ring_count=ring_count,
        location=location,
    )
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    assign_material(obj, material)
    for polygon in obj.data.polygons:
        polygon.use_smooth = True
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


def add_tilted_lectern_panel(
    name: str,
    center: tuple[float, float, float],
    width: float,
    depth: float,
    material: bpy.types.Material,
    *,
    pitch_degrees: float = 30.0,
    facing: str = "east",
) -> bpy.types.Object:
    """Create an east- or west-facing museum reading surface with clean UVs.

    Width runs north/south.  Depth rises toward the partition so a visitor in
    the contact room sees both the physical label and the accessible DOM card.
    The face normal points east/up, which also gives reliable ray casting.
    """
    pitch = math.radians(pitch_degrees)
    half_width = width / 2
    half_depth = depth / 2
    run = math.cos(pitch) * half_depth
    rise = math.sin(pitch) * half_depth
    facing_sign = 1.0 if facing == "east" else -1.0
    vertices = [
        (facing_sign * run, -half_width, -rise),
        (facing_sign * run, half_width, -rise),
        (-facing_sign * run, half_width, rise),
        (-facing_sign * run, -half_width, rise),
    ]
    mesh = bpy.data.meshes.new(f"{name}_Mesh")
    mesh.from_pydata(vertices, [], [(0, 1, 2, 3)])
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
    order: int | None = None,
) -> bpy.types.Object:
    anchor = add_empty(name, location, display_type="ARROWS", display_size=0.34)
    look_at(anchor, Vector(target))
    anchor["navigation_role"] = "view_anchor"
    anchor["view_id"] = name.removeprefix("VIEW_").lower()
    anchor["view_label"] = label
    anchor["view_kind"] = kind
    # Curated anchors may sit slightly above the walk controller's default
    # eye line.  Export the authored value instead of flattening every view
    # back to WALK_EYE_HEIGHT so the web camera keeps artwork centred.
    anchor["eye_height"] = float(location[2])
    if surface_index is not None:
        anchor["surface_index"] = surface_index
        anchor["target_node"] = f"SURFACE_DETAIL_{surface_index:02d}"
    if order is not None:
        anchor["order"] = order
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
        width = 2.48 * STANDARD_ARTWORK_SCALE
        height = width / ratio
    else:
        height = 2.72 * STANDARD_ARTWORK_SCALE
        width = height * ratio
    center_z = 2.82
    wall_x = -6.79 if side == "west" else 6.79
    center = (wall_x, along_wall, center_z)

    # Each work sits on its own rough-plaster bay from the current gallery-room
    # board. Walnut pilasters and bronze rails supply the softer material
    # rhythm; no unrelated fabric panel competes with the painting surface.
    wall_bay_x = -6.832 if side == "west" else 6.832
    groups["wall"].append(add_box(
        f"Surface_{index:02d}_Rough_Plaster_Display_Bay",
        (wall_bay_x, along_wall, 2.82),
        (0.032, 3.64, 4.92),
        materials["wall"],
        bevel=0.018,
        theme_role="wall",
    ))

    back_x = -6.87 if side == "west" else 6.87
    groups["shadow"].append(add_box(
        f"Surface_{index:02d}_Recess",
        (back_x, along_wall, center_z),
        (0.10, width + 0.42, height + 0.42),
        materials["shadow"],
        bevel=0.035,
        theme_role="shadow",
    ))

    # A thin concealed light plate produces the warm halo seen behind the
    # framed works in the approved room concepts. The artwork itself remains
    # colour-locked and receives no baked recolouring.
    glow_x = -6.805 if side == "west" else 6.805
    groups["emissive"].append(add_box(
        f"Surface_{index:02d}_Backlight",
        (glow_x, along_wall, center_z),
        (0.025, width + 0.28, height + 0.28),
        materials["emissive"],
        bevel=0.025,
        theme_role="emissive",
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
    plaque_y = along_wall + width / 2 + 0.40
    plaque_z = center_z - height * 0.16
    groups["plaque"].append(add_box(
        f"Surface_{index:02d}_Catalogue_Plaque",
        (plaque_x, plaque_y, plaque_z),
        (0.075, 0.92, 0.64),
        materials["plaque"],
        bevel=0.025,
        theme_role="plaque",
    ))
    label = add_vertical_panel(
        f"CATALOGUE_LABEL_{index:02d}",
        side,
        ((-6.646 if side == "west" else 6.646), plaque_y, plaque_z),
        0.84,
        0.54,
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
    panel["display_scale_note"] = "Magnified surface study — not shown to catalogue scale"
    panel["physical_display_not_to_scale"] = True
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
    for key in (
        "title", "year", "medium", "dimensions", "availability",
        "description", "detail_label", "source_asset", "display_scale_note",
    ):
        hotspot[key] = panel[key]

    light_x = -4.85 if side == "west" else 4.85
    portal_light = add_light(
        f"Surface_Spot_{index:02d}",
        "SPOT",
        (light_x, along_wall, 5.20),
        center,
        (1.0, 0.76, 0.58) if index % 2 else (0.78, 0.86, 1.0),
        425 if index % 2 else 360,
        web=True,
        theme_role="surface_spot",
        spot_size=math.radians(33),
    )
    add_spot_fixture(portal_light, f"Surface_Spot_{index:02d}", materials, groups)

    # Pull the curated camera toward the room centre so an artwork opens with
    # its complete frame and a margin of architecture, not a cropped macro.
    view_x = -2.82 if side == "west" else 2.82
    add_view_anchor(
        f"VIEW_Surface_{index:02d}",
        (view_x, along_wall, CURATED_EYE_HEIGHT),
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
    """Build a sparse raised reading rail and two legal lectern stations.

    About, Process and Inquiry remain subtle museum labels, but sit above all
    lounge furniture and outside the artwork footprints.  Privacy and Imprint
    live on individual angled lecterns along the solid contact-room partition;
    their DOM cards remain the authoritative readable presentation.
    """

    panels_by_id = {panel["id"]: panel for panel in SITE_PANELS}

    def annotate_panel(
        panel: bpy.types.Object,
        panel_data: dict[str, str],
        *,
        index: int,
        presentation: str,
        alignment: str,
        view_location: tuple[float, float, float],
        view_target: tuple[float, float, float],
    ) -> None:
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
        panel["alignment_group"] = alignment
        panel["presentation_mode"] = presentation
        view = add_view_anchor(
            f"VIEW_Site_{index:02d}",
            view_location,
            view_target,
            label=panel_data["title"],
            kind="site_panel",
        )
        view["target_node"] = panel.name
        view["demo_only"] = True

    # Raised museum reading rail.  All three frames clear the sofa top by more
    # than 0.30 m and avoid the south-wall artworks entirely.
    rail_layout = (
        (1, "about", -5.92, -5.78),
        (2, "process", -1.42, -1.42),
        (3, "inquiry", 1.42, 1.42),
    )
    rail_z = 2.14
    for index, panel_id, x, view_x in rail_layout:
        panel_data = panels_by_id[panel_id]
        recess = add_box(
            f"SITE_PANEL_{index:02d}_Recess",
            (x, -15.86, rail_z),
            (1.18, 0.10, 0.86),
            materials["shadow"],
            bevel=0.035,
            theme_role="shadow",
        )
        frame = add_box(
            f"SITE_PANEL_{index:02d}_Frame",
            (x, -15.74, rail_z),
            (1.10, 0.10, 0.78),
            materials["bronze"],
            bevel=0.035,
            theme_role="bronze",
        )
        backing = add_box(
            f"SITE_PANEL_{index:02d}_Backing",
            (x, -15.675, rail_z),
            (1.01, 0.055, 0.68),
            materials["plaque"],
            bevel=0.025,
            theme_role="plaque",
        )
        ledge = add_box(
            f"SITE_PANEL_{index:02d}_Reading_Ledge",
            (x, -15.59, rail_z - 0.43),
            (1.16, 0.16, 0.055),
            materials["bronze"],
            bevel=0.014,
            theme_role="bronze",
        )
        for structure in (recess, frame, backing, ledge):
            structure["demo_only"] = True
            structure["asset_role"] = "optional_3d_site_architecture"
        panel = add_vertical_panel(
            f"SITE_PANEL_{panel_id.upper()}",
            "south",
            (x, -15.642, rail_z),
            0.94,
            0.60,
            materials["plaque"],
        )
        panel["mounting_height_metres"] = rail_z
        panel["furniture_clearance_metres"] = 0.35
        annotate_panel(
            panel,
            panel_data,
            index=index,
            presentation="raised museum reading rail",
            alignment="demo-raised-information-rail",
            view_location=(view_x, -12.60, WALK_EYE_HEIGHT),
            view_target=(x, -15.64, rail_z),
        )

    # Privacy and imprint are deliberately separated onto their corresponding
    # sides of the solid centre partition. Privacy becomes the requested
    # consultation lectern; imprint belongs to the quieter contact lounge.
    # The open doorway between y=-10.96 and -13.04 remains completely free.
    lectern_layout = (
        (4, "privacy", -9.58, -1.0, "west", -2.15),
        (5, "imprint", -14.24, 1.0, "east", 2.15),
    )
    for index, panel_id, y, side_sign, facing, view_x in lectern_layout:
        panel_data = panels_by_id[panel_id]
        base = add_box(
            f"SITE_LECTERN_{panel_id.upper()}_Base",
            (side_sign * 0.47, y, 0.075),
            (0.68, 0.92, 0.15),
            materials["stone"],
            bevel=0.035,
            theme_role="stone",
        )
        column = add_box(
            f"SITE_LECTERN_{panel_id.upper()}_Column",
            (side_sign * 0.39, y, 0.61),
            (0.17, 0.20, 1.05),
            materials["bronze"],
            bevel=0.025,
            theme_role="bronze",
        )
        support = add_box(
            f"SITE_LECTERN_{panel_id.upper()}_Support",
            (side_sign * 0.72, y, 1.27),
            (0.88, 1.12, 0.065),
            materials["shadow"],
            bevel=0.025,
            theme_role="shadow",
        )
        support.rotation_euler.y = math.radians(30) * side_sign
        frame = add_tilted_lectern_panel(
            f"SITE_LECTERN_{panel_id.upper()}_Bronze_Frame",
            (side_sign * 0.72, y, 1.29),
            1.08,
            0.84,
            materials["bronze"],
            facing=facing,
        )
        panel = add_tilted_lectern_panel(
            f"SITE_PANEL_{panel_id.upper()}",
            (side_sign * 0.742, y, 1.312),
            0.94,
            0.69,
            materials["plaque"],
            facing=facing,
        )
        lip = add_box(
            f"SITE_LECTERN_{panel_id.upper()}_Reading_Lip",
            (side_sign * 1.095, y, 1.065),
            (0.055, 1.10, 0.07),
            materials["bronze"],
            bevel=0.012,
            theme_role="bronze",
        )
        for structure in (base, column, support, frame, lip):
            structure["demo_only"] = True
            structure["asset_role"] = "optional_3d_site_reading_station"
        panel["mounting_height_metres"] = 1.31
        panel["lectern_pitch_degrees"] = 30.0
        panel["clear_of_portals"] = True
        panel["route_clearance_metres"] = 1.25
        panel["lectern_facing"] = facing
        annotate_panel(
            panel,
            panel_data,
            index=index,
            presentation=f"angled {panel_id} reading lectern",
            alignment="demo-legal-reading-stations",
            view_location=(view_x, y, WALK_EYE_HEIGHT),
            view_target=(side_sign * 0.72, y, 1.29),
        )


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


def add_lush_leaf(
    name: str,
    base: Vector,
    direction: Vector,
    length: float,
    width: float,
    material: bpy.types.Material,
    group: list[bpy.types.Object],
    *,
    subdivision_levels: int = 1,
) -> bpy.types.Object:
    """Create a curved, paddle-shaped tropical leaf with a real silhouette."""
    segments = 14
    vertices: list[tuple[float, float, float]] = []
    for segment in range(segments + 1):
        t = segment / segments
        silhouette = math.sin(math.pi * t) ** 0.68
        half_width = max(0.004, silhouette * width)
        curl = math.sin(math.pi * t) * length * 0.072 + (t ** 2) * length * 0.035
        ridge = silhouette * width * 0.11
        z = t * length
        vertices.extend([
            (-half_width, curl - ridge * 0.20, z),
            (0.0, curl + ridge, z),
            (half_width * 0.97, curl - ridge * 0.20, z),
        ])
    faces = []
    for segment in range(segments):
        start = segment * 3
        next_start = (segment + 1) * 3
        faces.extend([
            (start, next_start, next_start + 1, start + 1),
            (start + 1, next_start + 1, next_start + 2, start + 2),
        ])
    mesh = bpy.data.meshes.new(f"{name}_Mesh")
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    leaf = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(leaf)
    leaf.location = base
    leaf.rotation_mode = "QUATERNION"
    leaf.rotation_quaternion = direction.normalized().to_track_quat("Z", "Y")
    assign_material(leaf, material)
    solidify = leaf.modifiers.new("Natural leaf thickness", "SOLIDIFY")
    solidify.thickness = 0.009
    solidify.offset = 0.0
    bevel = leaf.modifiers.new("Rounded leaf edge", "BEVEL")
    bevel.width = 0.006
    bevel.segments = 2
    if subdivision_levels > 0:
        subdivision = leaf.modifiers.new("Organic leaf surface", "SUBSURF")
        subdivision.levels = subdivision_levels
        subdivision.render_levels = subdivision_levels
    for polygon in leaf.data.polygons:
        polygon.use_smooth = True
    leaf["asset_role"] = "modeled_gallery_plant_leaf"
    mark_web(leaf)
    group.append(leaf)
    return leaf


def animate_botanical_breeze(
    leaf: bpy.types.Object,
    clip_index: int,
    phase: float,
) -> None:
    """Add a nearly imperceptible, seamless gallery-air movement.

    Only four hero leaves are animated in the complete scene.  Keeping the
    amplitude below two degrees avoids a decorative/game-like plant motion,
    while separate object actions survive glTF export on desktop and mobile.
    """
    leaf["animation_role"] = "ambient_botanical_breeze"
    leaf["animation_loop"] = True
    leaf["animation_duration_seconds"] = 2.0
    leaf["motion_amplitude_degrees"] = 1.65
    base_rotation = leaf.rotation_quaternion.copy()
    for frame, progress in ((1, 0.0), (13, 0.25), (25, 0.5), (37, 0.75), (49, 1.0)):
        cycle = progress * math.tau + phase
        bend = math.sin(cycle) * math.radians(1.65)
        flutter = math.sin(cycle * 2.0 + phase * 0.37) * math.radians(0.42)
        leaf.rotation_quaternion = (
            base_rotation
            @ Quaternion((1.0, 0.0, 0.0), bend)
            @ Quaternion((0.0, 0.0, 1.0), flutter)
        )
        leaf.keyframe_insert(data_path="rotation_quaternion", frame=frame)
    if leaf.animation_data and leaf.animation_data.action:
        leaf.animation_data.action.name = f"Botanical_Breeze_{clip_index:02d}"


def add_lush_botanical(
    prefix: str,
    origin: tuple[float, float, float],
    materials: dict[str, bpy.types.Material],
    groups: dict[str, list[bpy.types.Object]],
    seed: int,
    *,
    planter_role: str = "planter",
    animate: bool = True,
    demo_only: bool = False,
    scale_factor: float = 1.0,
    leaf_count: int = 17,
    leaf_subdivision_levels: int = 1,
) -> None:
    """High-quality broad-leaf plant inspired by the approved room boards."""
    existing_objects = {obj.name for obj in bpy.context.scene.objects}
    random.seed(seed)
    x, y, _ = origin
    bpy.ops.mesh.primitive_cone_add(
        vertices=40,
        radius1=0.43,
        radius2=0.49,
        depth=1.18,
        location=(x, y, 0.59),
    )
    planter = bpy.context.object
    planter.name = f"{prefix}_Tapered_Planter"
    assign_material(planter, materials[planter_role])
    planter_bevel = planter.modifiers.new("Planter soft edge", "BEVEL")
    planter_bevel.width = 0.055
    planter_bevel.segments = 4
    for polygon in planter.data.polygons:
        polygon.use_smooth = True
    planter["theme_role"] = planter_role
    planter["asset_role"] = "modeled_premium_gallery_planter"
    mark_web(planter)
    groups[planter_role].append(planter)

    foot = add_cylinder(f"{prefix}_Shadow_Foot", (x, y, 0.055), 0.34, 0.08, materials["shadow"], vertices=36)
    foot["theme_role"] = "shadow"
    groups["shadow"].append(foot)
    rim = add_torus(f"{prefix}_Bronze_Rim", (x, y, 1.16), 0.475, 0.030, materials["bronze"], major_segments=40, minor_segments=10)
    rim["theme_role"] = "bronze"
    groups["bronze"].append(rim)
    soil = add_cylinder(f"{prefix}_Soil", (x, y, 1.145), 0.43, 0.024, materials["shadow"], vertices=36)
    soil["theme_role"] = "shadow"
    groups["shadow"].append(soil)

    stem_base = Vector((x, y, 1.13))
    for index in range(leaf_count):
        angle = (index / leaf_count) * math.tau
        angle += random.uniform(-0.20, 0.20)
        radius = random.uniform(0.18, 0.54)
        leaf_base = Vector((
            x + math.cos(angle) * radius,
            y + math.sin(angle) * radius * 0.64,
            random.uniform(1.64, 2.88),
        ))
        add_stem_between(
            f"{prefix}_Green_Stem_{index:02d}",
            stem_base,
            leaf_base,
            random.uniform(0.013, 0.022),
            materials["stem"],
            groups["stem"],
        )
        outward = Vector((
            math.cos(angle) * random.uniform(0.52, 0.90),
            math.sin(angle) * random.uniform(0.38, 0.72),
            random.uniform(0.30, 0.82),
        )).normalized()
        leaf_length = random.uniform(0.76, 1.30)
        leaf_group = groups["leaf_a"] if index % 3 else groups["leaf_b"]
        leaf_material = materials["leaf_a"] if index % 3 else materials["leaf_b"]
        # These two silhouette leaves remain individual so their subtle
        # actions are not destroyed by the static leaf batching pass.
        animated_leaf = animate and index in (4, 12)
        export_group: list[bpy.types.Object] = [] if animated_leaf else leaf_group
        leaf = add_lush_leaf(
            f"{prefix}_Broad_Leaf_{index:02d}",
            leaf_base,
            outward,
            leaf_length,
            random.uniform(0.19, 0.32),
            leaf_material,
            export_group,
            subdivision_levels=leaf_subdivision_levels,
        )
        if animated_leaf:
            clip_offset = 0 if prefix.endswith("West") else 2
            animate_botanical_breeze(
                leaf,
                clip_offset + (1 if index == 4 else 2),
                phase=seed * 0.013 + index * 0.71,
            )
            if demo_only:
                leaf["demo_only"] = True
                leaf["asset_role"] = "optional_3d_site_botanical"
        vein_end = leaf_base + outward * leaf_length * 0.92
        add_stem_between(
            f"{prefix}_Leaf_Vein_{index:02d}",
            leaf_base,
            vein_end,
            0.006,
            materials["stem"],
            groups["stem"],
        )

    if not math.isclose(scale_factor, 1.0):
        pivot = Vector(origin)
        for obj in bpy.context.scene.objects:
            if obj.name in existing_objects:
                continue
            obj.location = pivot + (obj.location - pivot) * scale_factor
            obj.scale = tuple(component * scale_factor for component in obj.scale)
            obj["botanical_scale_factor"] = scale_factor


def build_gallery_shell(
    materials: dict[str, bpy.types.Material],
    groups: dict[str, list[bpy.types.Object]],
) -> None:
    wall_thickness = 0.30
    groups["wall"].extend([
        add_box("Room_North_Wall", (0, ROOM_HALF_DEPTH, ROOM_HEIGHT / 2), (14.0, wall_thickness, ROOM_HEIGHT), materials["wall"], theme_role="wall"),
        add_box("Room_South_Wall_Left", (-5.78, -ROOM_HALF_DEPTH, ROOM_HEIGHT / 2), (2.44, wall_thickness, ROOM_HEIGHT), materials["wall"], theme_role="wall"),
        add_box("Room_South_Wall_Centre", (0, -ROOM_HALF_DEPTH, ROOM_HEIGHT / 2), (4.88, wall_thickness, ROOM_HEIGHT), materials["wall"], theme_role="wall"),
        add_box("Room_South_Wall_Right", (5.78, -ROOM_HALF_DEPTH, ROOM_HEIGHT / 2), (2.44, wall_thickness, ROOM_HEIGHT), materials["wall"], theme_role="wall"),
        add_box("Room_South_Lintel_Private", (-3.50, -ROOM_HALF_DEPTH, 4.23), (2.12, wall_thickness, 3.15), materials["wall"], theme_role="wall"),
        add_box("Room_South_Lintel_Contact", (3.50, -ROOM_HALF_DEPTH, 4.23), (2.12, wall_thickness, 3.15), materials["wall"], theme_role="wall"),
        add_box("Room_West_Wall", (-ROOM_HALF_WIDTH, 0, ROOM_HEIGHT / 2), (wall_thickness, 16.0, ROOM_HEIGHT), materials["wall"], theme_role="wall"),
        add_box("Room_East_Wall", (ROOM_HALF_WIDTH, 0, ROOM_HEIGHT / 2), (wall_thickness, 16.0, ROOM_HEIGHT), materials["wall"], theme_role="wall"),
    ])

    # In normal gallery mode these black-stone doors close the optional site
    # wing. Demo mode hides them and reveals two continuous walk-throughs.
    for room_id, x in (("Private", -3.50), ("Contact", 3.50)):
        door = add_box(
            f"Standard_Door_{room_id}",
            (x, -7.82, 1.33),
            (2.04, 0.16, 2.65),
            materials["shadow"],
            bevel=0.028,
            theme_role="shadow",
        )
        door["demo_hidden"] = True
        door["asset_role"] = "normal_gallery_demo_wing_closure"
        for jamb_x in (x - 1.10, x + 1.10):
            groups["bronze"].append(add_box(
                f"Demo_Door_{room_id}_Jamb_{jamb_x:+.2f}",
                (jamb_x, -7.67, 1.42),
                (0.055, 0.10, 2.84),
                materials["bronze"],
                bevel=0.008,
                theme_role="bronze",
            ))
    groups["ceiling"].append(add_box(
        "Room_Matte_Black_Ceiling",
        (0, 0, ROOM_HEIGHT + 0.12),
        (14.0, 16.0, 0.24),
        materials["ceiling"],
        theme_role="ceiling",
    ))
    groups["floor"].append(add_box(
        "Room_Deep_Grout_Base",
        (0, 0, -0.10),
        (14.0, 16.0, 0.20),
        materials["floor"],
        theme_role="floor",
    ))

    # Large polished black-marble slabs match the approved material board.
    # Sparse joints and tiny bevels create realistic reflection breaks.
    tile_width = 3.36
    tile_depth = 1.88
    for row in range(8):
        for column in range(4):
            x = -5.10 + column * 3.40
            y = -6.72 + row * 1.92
            group_name = "floor_tile_a" if (row + column) % 2 else "floor_tile_b"
            groups[group_name].append(add_box(
                f"Black_Marble_Slab_{row + 1:02d}_{column + 1:02d}",
                (x, y, 0.010),
                (tile_width, tile_depth, 0.050),
                materials[group_name],
                bevel=0.014,
                theme_role=group_name,
            ))

    # Concealed skirting and ceiling coves wrap the room in warm 2700K light.
    for name, location, dimensions in (
        ("Floor_Cove_West", (-6.73, 0, 0.30), (0.035, 15.35, 0.040)),
        ("Floor_Cove_East", (6.73, 0, 0.30), (0.035, 15.35, 0.040)),
        ("Floor_Cove_North", (0, 7.68, 0.30), (13.45, 0.035, 0.040)),
        ("Floor_Cove_South", (0, -7.68, 0.30), (13.45, 0.035, 0.040)),
        ("Ceiling_Cove_West", (-6.72, 0, 5.43), (0.040, 15.30, 0.055)),
        ("Ceiling_Cove_East", (6.72, 0, 5.43), (0.040, 15.30, 0.055)),
        ("Ceiling_Cove_North", (0, 7.66, 5.43), (13.40, 0.040, 0.055)),
        ("Ceiling_Cove_South", (0, -7.66, 5.43), (13.40, 0.040, 0.055)),
    ):
        groups["emissive"].append(add_box(name, location, dimensions, materials["emissive"], bevel=0.010, theme_role="emissive"))

    # Dark stained-oak pilasters divide the textured display walls into bays.
    for side, x in (("West", -6.81), ("East", 6.81)):
        for bay_index, y in enumerate((-6.55, -2.70, 1.57, 5.60), start=1):
            groups["wood"].append(add_box(
                f"{side}_Dark_Oak_Pilaster_{bay_index}",
                (x, y, 2.88),
                (0.24, 0.38, 5.25),
                materials["wood"],
                bevel=0.024,
                theme_role="wood",
            ))
            groups["bronze"].append(add_box(
                f"{side}_Bronze_Datum_{bay_index}",
                ((-6.665 if side == "West" else 6.665), y, 2.88),
                (0.020, 0.42, 5.10),
                materials["bronze"],
                bevel=0.005,
                theme_role="bronze",
            ))

    # Backlit bookmatched-marble focal wall behind the genuine wARTrobe.
    groups["shadow"].append(add_box(
        "Feature_Wall_Deep_Reveal",
        (0, 7.79, 2.90),
        (5.92, 0.12, 5.18),
        materials["shadow"],
        bevel=0.035,
        theme_role="shadow",
    ))
    groups["emissive"].append(add_box(
        "Feature_Wall_Backlight",
        (0, 7.715, 2.90),
        (5.72, 0.045, 5.02),
        materials["emissive"],
        bevel=0.025,
        theme_role="emissive",
    ))
    groups["floor_alt"].append(add_box(
        "Feature_Wall_Black_Marble",
        (0, 7.665, 2.90),
        (5.48, 0.055, 4.80),
        materials["floor_alt"],
        bevel=0.020,
        theme_role="floor_alt",
    ))
    for x in (-2.80, 2.80):
        groups["bronze"].append(add_box(
            f"Feature_Wall_Bronze_Edge_{x:+.2f}",
            (x, 7.59, 2.90),
            (0.035, 0.050, 4.92),
            materials["bronze"],
            bevel=0.006,
            theme_role="bronze",
        ))
    for x in (-4.55, 4.55):
        groups["wood"].append(add_box(
            f"North_Dark_Oak_Panel_{x:+.2f}",
            (x, 7.75, 2.90),
            (2.10, 0.10, 5.05),
            materials["wood"],
            bevel=0.025,
            theme_role="wood",
        ))

    # Matte tracks and compact adjustable spots keep the ceiling architectural.
    for x in (-4.90, 0.0, 4.90):
        groups["shadow"].append(add_box(
            f"Ceiling_Track_{x:+.0f}",
            (x, 0.20, 5.57),
            (0.065, 13.8, 0.065),
            materials["shadow"],
            bevel=0.012,
            theme_role="shadow",
        ))

    # Low-intensity real lights make the emissive coves affect marble and wood.
    for index, location in enumerate((
        (-5.85, -4.8, 0.48), (5.85, -4.8, 0.48),
        (-5.85, 0.4, 0.48), (5.85, 0.4, 0.48),
        (-5.2, 5.9, 0.52), (5.2, 5.9, 0.52),
        (-5.7, 3.5, 5.08), (5.7, 3.5, 5.08),
    ), start=1):
        add_light(
            f"Cove_Fill_{index:02d}",
            "POINT",
            location,
            (0, 0, 2.2),
            (1.0, 0.76, 0.58),
            52 if index <= 6 else 40,
            web=True,
            theme_role="cove_fill",
        )

    # South threshold closes the 360° room and holds the optional site demo.
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
        (1.0, 0.76, 0.58),
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
        (0, 7.61, center_z),
        (width + 0.72, 0.12, height + 0.72),
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
            (1.0, 0.76, 0.58),
            580,
            web=True,
            theme_role="wartrobe_spot",
            spot_size=math.radians(31),
        )
        add_spot_fixture(wartrobe_light, f"WARTROBE_Spot_{index}", materials, groups)

    add_view_anchor(
        "VIEW_wARTrobe",
        (0, 3.58, CURATED_EYE_HEIGHT),
        (0, 7.40, 2.62),
        label="wARTrobe · Front",
        kind="focal_object",
    )["target_node"] = surface.name
    return surface


def add_bench(materials: dict[str, bpy.types.Material], groups: dict[str, list[bpy.types.Object]]) -> None:
    # Long tailored leather bench from the approved room concept: softened
    # cushion, dark-oak apron, stitched bays and patinated-bronze sled feet.
    bench_y = -1.72
    footprint_scale = 0.76
    groups["leather"].append(add_box(
        "Bench_Leather_Cushion",
        (0, bench_y, 0.62),
        (3.92 * footprint_scale, 1.02 * footprint_scale, 0.23),
        materials["leather"],
        bevel=0.105,
        theme_role="leather",
    ))
    groups["wood"].append(add_box(
        "Bench_Dark_Oak_Apron",
        (0, bench_y, 0.455),
        (3.66 * footprint_scale, 0.80 * footprint_scale, 0.19),
        materials["wood"],
        bevel=0.045,
        theme_role="wood",
    ))
    for y in (bench_y - 0.47 * footprint_scale, bench_y + 0.47 * footprint_scale):
        groups["leather_seam"].append(add_box(
            f"Bench_Leather_Piping_{y:+.2f}",
            (0, y, 0.685),
            (3.76 * footprint_scale, 0.018, 0.018),
            materials["leather_seam"],
            bevel=0.007,
            theme_role="leather_seam",
        ))
    for seam_index, x in enumerate((-1.18 * footprint_scale, 0.0, 1.18 * footprint_scale), start=1):
        groups["leather_seam"].append(add_box(
            f"Bench_Top_Seam_{seam_index:02d}",
            (x, bench_y, 0.738),
            (0.014, 0.88 * footprint_scale, 0.012),
            materials["leather_seam"],
            bevel=0.004,
            theme_role="leather_seam",
        ))
    for x in (-1.48 * footprint_scale, 1.48 * footprint_scale):
        groups["bronze"].append(add_box(
            f"Bench_Leg_{x:+.2f}",
            (x, bench_y, 0.245),
            (0.12, 0.72 * footprint_scale, 0.43),
            materials["bronze"],
            bevel=0.032,
            theme_role="bronze",
        ))
        groups["bronze"].append(add_box(
            f"Bench_Leg_Foot_{x:+.2f}",
            (x, bench_y, 0.065),
            (0.38 * footprint_scale, 0.84 * footprint_scale, 0.065),
            materials["bronze"],
            bevel=0.018,
            theme_role="bronze",
        ))


def local_xy(
    center: tuple[float, float],
    offset: tuple[float, float],
    angle: float,
) -> tuple[float, float]:
    cosine = math.cos(angle)
    sine = math.sin(angle)
    return (
        center[0] + offset[0] * cosine - offset[1] * sine,
        center[1] + offset[0] * sine + offset[1] * cosine,
    )


def add_rotated_box(
    name: str,
    center: tuple[float, float],
    offset: tuple[float, float],
    z: float,
    dimensions: tuple[float, float, float],
    angle: float,
    material: bpy.types.Material,
    group: list[bpy.types.Object],
    role: str,
    *,
    bevel: float = 0.0,
) -> bpy.types.Object:
    x, y = local_xy(center, offset, angle)
    obj = add_box(name, (x, y, z), dimensions, material, bevel=bevel, theme_role=role)
    obj.rotation_euler.z = angle
    group.append(obj)
    return obj


def add_floor_wayfinding_segment(
    name: str,
    start: tuple[float, float],
    end: tuple[float, float],
    material: bpy.types.Material,
    group: list[bpy.types.Object],
    *,
    width: float = 0.042,
) -> bpy.types.Object:
    """Lay a thin, non-colliding bronze route line above the marble."""
    delta_x = end[0] - start[0]
    delta_y = end[1] - start[1]
    length = math.hypot(delta_x, delta_y)
    if length <= 0.001:
        raise ValueError(f"Wayfinding segment {name} has no length")
    obj = add_box(
        name,
        ((start[0] + end[0]) / 2, (start[1] + end[1]) / 2, 0.046),
        (length, width, 0.008),
        material,
        bevel=0.010,
        theme_role="wayfinding",
    )
    obj.rotation_euler.z = math.atan2(delta_y, delta_x)
    obj["asset_role"] = "premium_floor_wayfinding"
    obj["navigation_role"] = "visual_wayfinding_only"
    obj["collision_role"] = "none"
    obj["demo_only"] = True
    group.append(obj)
    return obj


def add_floor_wayfinding_chevron(
    name: str,
    point: tuple[float, float],
    direction: tuple[float, float],
    material: bpy.types.Material,
    group: list[bpy.types.Object],
) -> None:
    """Add one restrained airport-style direction chevron."""
    direction_vector = Vector((direction[0], direction[1]))
    if direction_vector.length <= 0.001:
        return
    direction_vector.normalize()
    perpendicular = Vector((-direction_vector.y, direction_vector.x))
    centre = Vector(point)
    tip = centre + direction_vector * 0.23
    tail_centre = centre - direction_vector * 0.17
    for side in (-1.0, 1.0):
        tail = tail_centre + perpendicular * 0.16 * side
        add_floor_wayfinding_segment(
            f"{name}_{'L' if side < 0 else 'R'}",
            (float(tail.x), float(tail.y)),
            (float(tip.x), float(tip.y)),
            material,
            group,
            width=0.034,
        )


def add_floor_wayfinding(
    materials: dict[str, bpy.types.Material],
    groups: dict[str, list[bpy.types.Object]],
) -> int:
    """Guide visitors through the clear circulation spine without barriers."""
    points = [
        (0.00, -3.55),
        (-1.85, -5.05),
        (-3.50, -7.12),
        (-3.50, -8.62),
        (-3.05, -10.35),
        (-2.75, -12.00),
        (0.00, -12.00),
        (2.55, -12.00),
        (2.55, -14.55),
    ]
    for index, (start, end) in enumerate(zip(points, points[1:]), start=1):
        add_floor_wayfinding_segment(
            f"Demo_Wayfinding_Path_{index:02d}",
            start,
            end,
            materials["wayfinding"],
            groups["wayfinding"],
        )

    add_floor_wayfinding_chevron(
        "Demo_Wayfinding_Private_Arrow",
        (-3.50, -8.20),
        (0.20, -1.0),
        materials["wayfinding"],
        groups["wayfinding"],
    )
    add_floor_wayfinding_chevron(
        "Demo_Wayfinding_CrossGallery_Arrow",
        (-0.45, -12.00),
        (1.0, 0.0),
        materials["wayfinding"],
        groups["wayfinding"],
    )
    add_floor_wayfinding_chevron(
        "Demo_Wayfinding_Contact_Arrow",
        (2.55, -13.72),
        (0.0, -1.0),
        materials["wayfinding"],
        groups["wayfinding"],
    )
    return len(points) - 1 + 6


def add_demo_sofa(
    prefix: str,
    center: tuple[float, float],
    angle: float,
    materials: dict[str, bpy.types.Material],
    groups: dict[str, list[bpy.types.Object]],
    width: float = 2.90,
) -> None:
    """Tailored low lounge seating matching the dark private-room reference."""
    add_rotated_box(prefix + "_Plinth", center, (0, 0), 0.28, (width - 0.18, 0.78, 0.24), angle, materials["wood"], groups["wood"], "wood", bevel=0.035)
    add_rotated_box(prefix + "_Seat", center, (0, -0.02), 0.55, (width, 0.94, 0.30), angle, materials["leather"], groups["leather"], "leather", bevel=0.095)
    add_rotated_box(prefix + "_Back", center, (0, 0.41), 1.00, (width, 0.20, 0.98), angle, materials["leather"], groups["leather"], "leather", bevel=0.075)
    for side in (-1, 1):
        add_rotated_box(prefix + f"_Arm_{side:+d}", center, (side * (width / 2 - 0.10), 0), 0.78, (0.20, 0.90, 0.62), angle, materials["leather"], groups["leather"], "leather", bevel=0.065)
    for side in (-1, 1):
        add_rotated_box(prefix + f"_Bronze_Foot_{side:+d}", center, (side * (width * 0.31), 0), 0.105, (0.12, 0.64, 0.21), angle, materials["bronze"], groups["bronze"], "bronze", bevel=0.018)


def add_demo_coffee_table(
    prefix: str,
    center: tuple[float, float],
    materials: dict[str, bpy.types.Material],
    groups: dict[str, list[bpy.types.Object]],
    *,
    scale_factor: float = 1.0,
) -> None:
    # A narrow side-table scale preserves the lounge composition without
    # plugging the 1.2 m circulation lane from the entrance to the south wall.
    add_rotated_box(prefix + "_Top", center, (0, 0), 0.45 * scale_factor, (1.34 * scale_factor, 0.68 * scale_factor, 0.11 * scale_factor), 0, materials["stone"], groups["stone"], "stone", bevel=0.030 * scale_factor)
    add_rotated_box(prefix + "_Shadow", center, (0, 0), 0.29 * scale_factor, (0.94 * scale_factor, 0.42 * scale_factor, 0.19 * scale_factor), 0, materials["shadow"], groups["shadow"], "shadow", bevel=0.024 * scale_factor)
    for x in (-0.46, 0.46):
        add_rotated_box(prefix + f"_Bronze_Leg_{x:+.2f}", center, (x * scale_factor, 0), 0.21 * scale_factor, (0.07 * scale_factor, 0.44 * scale_factor, 0.36 * scale_factor), 0, materials["bronze"], groups["bronze"], "bronze", bevel=0.012 * scale_factor)


def add_demo_chair(
    prefix: str,
    center: tuple[float, float],
    angle: float,
    materials: dict[str, bpy.types.Material],
    groups: dict[str, list[bpy.types.Object]],
) -> None:
    # Fuller cushions and rounded edges give the small consultation chairs the
    # tailored softness of the board without increasing their walk footprint.
    add_rotated_box(prefix + "_Seat", center, (0, 0), 0.51, (0.58, 0.58, 0.22), angle, materials["leather"], groups["leather"], "leather", bevel=0.085)
    add_rotated_box(prefix + "_Back", center, (0, 0.245), 0.95, (0.58, 0.19, 0.82), angle, materials["leather"], groups["leather"], "leather", bevel=0.075)
    for dx in (-0.18, 0.18):
        for dy in (-0.18, 0.18):
            add_rotated_box(prefix + f"_Walnut_Leg_{dx:+.2f}_{dy:+.2f}", center, (dx, dy), 0.23, (0.055, 0.055, 0.46), angle, materials["wood"], groups["wood"], "wood", bevel=0.012)


def add_demo_meeting_table(
    prefix: str,
    center: tuple[float, float],
    materials: dict[str, bpy.types.Material],
    groups: dict[str, list[bpy.types.Object]],
    *,
    angle: float = math.pi / 2,
) -> None:
    # A two-seat consultation table leaves a generous route from the portal to
    # the south artwork.  The offset pair feels intentional without presenting
    # a wall of chair backs to the visitor's entrance camera.
    table_length = 1.96
    table_depth = 0.78
    add_rotated_box(prefix + "_Table_Top", center, (0, 0), 0.79, (table_length, table_depth, 0.15), angle, materials["wood"], groups["wood"], "wood", bevel=0.050)
    add_rotated_box(prefix + "_Table_Inlay", center, (0, 0), 0.88, (1.62, 0.10, 0.030), angle, materials["bronze"], groups["bronze"], "bronze", bevel=0.010)
    for along in (-0.58, 0.58):
        add_rotated_box(prefix + f"_Table_Walnut_Leg_{along:+.2f}", center, (along, 0), 0.39, (0.13, 0.64, 0.74), angle, materials["wood"], groups["wood"], "wood", bevel=0.026)

    for side, side_label in ((1, "West"), (-1, "East")):
        chair_angle = angle if side > 0 else angle + math.pi
        chair_center = local_xy(center, (0.0, side * 0.72), angle)
        add_demo_chair(f"{prefix}_Chair_{side_label}", chair_center, chair_angle, materials, groups)


def add_demo_shelving(
    prefix: str,
    wall_x: float,
    center_y: float,
    materials: dict[str, bpy.types.Material],
    groups: dict[str, list[bpy.types.Object]],
) -> None:
    """Illuminated walnut display library mounted flush to either side wall."""
    inward = -1.0 if wall_x > 0 else 1.0
    for offset_y in (-2.35, -0.78, 0.78, 2.35):
        y = center_y + offset_y
        groups["wood"].append(add_box(f"{prefix}_Shelf_Vertical_{y:+.2f}", (wall_x, y, 2.62), (0.28, 0.10, 4.30), materials["wood"], bevel=0.018, theme_role="wood"))
    for z in (0.65, 1.55, 2.45, 3.35, 4.25):
        groups["wood"].append(add_box(f"{prefix}_Shelf_Horizontal_{z:.2f}", (wall_x + inward * 0.05, center_y, z), (0.36, 5.25, 0.10), materials["wood"], bevel=0.015, theme_role="wood"))
        groups["emissive"].append(add_box(f"{prefix}_Shelf_Light_{z:.2f}", (wall_x + inward * 0.27, center_y, z - 0.07), (0.025, 5.00, 0.025), materials["emissive"], bevel=0.006, theme_role="emissive"))
    for index, (offset_y, shelf_z, radius) in enumerate((
        (-1.95, 0.65, 0.16), (-1.20, 1.55, 0.12), (-0.42, 2.45, 0.18),
        (0.42, 0.65, 0.14), (1.20, 3.35, 0.16), (1.95, 1.55, 0.13),
    ), start=1):
        y = center_y + offset_y
        vessel_z = shelf_z + radius * 0.96
        vessel = add_cylinder(f"{prefix}_Shelf_Vessel_{index:02d}", (wall_x + inward * 0.32, y, vessel_z), radius, radius * 1.85, materials["ceramic"], vertices=20)
        vessel["theme_role"] = "ceramic"
        groups["ceramic"].append(vessel)

    # Restrained book stacks and bronze keepsakes stop the library reading as
    # an empty grid while preserving large areas of visual quiet.
    for index, (offset_y, shelf_z) in enumerate(((-1.55, 1.55), (0.78, 2.45), (1.48, 0.65)), start=1):
        for book_index in range(3):
            groups["wood"].append(add_box(
                f"{prefix}_Book_{index:02d}_{book_index + 1:02d}",
                (wall_x + inward * (0.34 + book_index * 0.025), center_y + offset_y, shelf_z + 0.038 + book_index * 0.075),
                (0.11, 0.42 - book_index * 0.035, 0.065),
                materials["wood"],
                bevel=0.008,
                theme_role="wood",
            ))


def add_demo_decanter_set(
    prefix: str,
    center: tuple[float, float],
    angle: float,
    materials: dict[str, bpy.types.Material],
    groups: dict[str, list[bpy.types.Object]],
) -> None:
    """Small clear-glass ritual object for the consultation table."""
    tray_center = local_xy(center, (0.0, 0.0), angle)
    add_rotated_box(prefix + "_Tray", center, (0, 0), 0.895, (0.52, 0.30, 0.025), angle, materials["stone"], groups["stone"], "stone", bevel=0.018)
    decanter_xy = local_xy(tray_center, (-0.11, 0.0), angle)
    decanter = add_cylinder(prefix + "_Decanter", (decanter_xy[0], decanter_xy[1], 1.035), 0.075, 0.25, materials["glass"], vertices=24)
    decanter["theme_role"] = "glass"
    groups["glass"].append(decanter)
    neck = add_cylinder(prefix + "_Decanter_Neck", (decanter_xy[0], decanter_xy[1], 1.205), 0.030, 0.12, materials["glass"], vertices=20)
    neck["theme_role"] = "glass"
    groups["glass"].append(neck)
    stopper = add_sphere(prefix + "_Decanter_Stopper", (decanter_xy[0], decanter_xy[1], 1.292), (0.045, 0.045, 0.050), materials["glass"], segments=16, ring_count=8)
    stopper["theme_role"] = "glass"
    groups["glass"].append(stopper)
    for index, along in enumerate((0.08, 0.20), start=1):
        glass_xy = local_xy(tray_center, (along, 0.0), angle)
        glass = add_cylinder(prefix + f"_Glass_{index:02d}", (glass_xy[0], glass_xy[1], 0.985), 0.047, 0.16, materials["glass"], vertices=20)
        glass["theme_role"] = "glass"
        groups["glass"].append(glass)


def add_demo_desk_lamp(
    center: tuple[float, float],
    materials: dict[str, bpy.types.Material],
    groups: dict[str, list[bpy.types.Object]],
) -> None:
    x, y = center
    base = add_cylinder("Contact_Lamp_Base", (x, y, 1.30), 0.25, 0.06, materials["bronze"], vertices=28)
    base["theme_role"] = "bronze"
    groups["bronze"].append(base)
    stem = add_cylinder("Contact_Lamp_Stem", (x, y, 1.83), 0.028, 1.02, materials["bronze"], vertices=18)
    stem["theme_role"] = "bronze"
    groups["bronze"].append(stem)
    groups["bronze"].append(add_box("Contact_Lamp_Bar", (x, y, 2.34), (0.82, 0.10, 0.10), materials["bronze"], bevel=0.045, theme_role="bronze"))
    groups["emissive"].append(add_box("Contact_Lamp_Aperture", (x, y - 0.06, 2.30), (0.68, 0.035, 0.025), materials["emissive"], bevel=0.008, theme_role="emissive"))


def add_demo_bonsai(
    center: tuple[float, float],
    materials: dict[str, bpy.types.Material],
    groups: dict[str, list[bpy.types.Object]],
) -> None:
    x, y = center
    pot = add_cylinder("Contact_Bonsai_Pot", (x, y, 1.43), 0.32, 0.28, materials["planter"], vertices=28)
    pot["theme_role"] = "planter"
    groups["planter"].append(pot)
    trunk_start = Vector((x, y, 1.54))
    trunk_end = Vector((x + 0.08, y, 2.42))
    add_stem_between("Contact_Bonsai_Trunk", trunk_start, trunk_end, 0.050, materials["wood"], groups["wood"])
    for index, (dx, dy, dz, scale) in enumerate((
        (-0.28, 0.00, 2.16, (0.34, 0.24, 0.18)), (0.22, 0.03, 2.20, (0.38, 0.25, 0.18)),
        (-0.05, 0.00, 2.43, (0.36, 0.24, 0.20)), (0.38, 0.02, 2.52, (0.26, 0.18, 0.16)),
        (-0.34, 0.02, 2.54, (0.25, 0.17, 0.15)), (0.08, 0.00, 2.72, (0.28, 0.19, 0.17)),
    ), start=1):
        crown = add_sphere(f"Contact_Bonsai_Crown_{index:02d}", (x + dx, y + dy, dz), scale, materials["leaf_a"], segments=16, ring_count=10)
        crown["theme_role"] = "botanical_leaf"
        groups["leaf_a"].append(crown)


def add_demo_pendant(
    prefix: str,
    center: tuple[float, float],
    materials: dict[str, bpy.types.Material],
    groups: dict[str, list[bpy.types.Object]],
) -> None:
    x, y = center
    cord = add_cylinder(prefix + "_Pendant_Cord", (x, y, 4.55), 0.018, 2.25, materials["bronze"], vertices=14)
    cord["theme_role"] = "bronze"
    groups["bronze"].append(cord)
    ring = add_torus(prefix + "_Pendant_Bronze_Ring", (x, y, 3.40), 0.36, 0.045, materials["bronze"], major_segments=32, minor_segments=10)
    ring["theme_role"] = "bronze"
    ring.rotation_euler.x = math.pi / 2
    groups["bronze"].append(ring)
    globe = add_sphere(prefix + "_Pendant_Glass", (x, y, 3.40), (0.28, 0.28, 0.32), materials["glass"], segments=20, ring_count=12)
    globe["theme_role"] = "glass"
    groups["glass"].append(globe)
    glow = add_sphere(prefix + "_Pendant_Glow", (x, y, 3.40), (0.09, 0.09, 0.11), materials["emissive"], segments=14, ring_count=8)
    glow["theme_role"] = "emissive"
    groups["emissive"].append(glow)


def add_demo_water_ribbon(
    name: str,
    location: tuple[float, float, float],
    width: float,
    height: float,
    phase: float,
    material: bpy.types.Material,
) -> bpy.types.Object:
    """Smooth organic water trace with an irregular, tapered silhouette."""
    segments = 42
    vertices: list[tuple[float, float, float]] = []
    faces: list[tuple[int, int, int, int]] = []
    for segment in range(segments + 1):
        t = segment / segments
        z = -height / 2 + t * height
        centre_drift = math.sin(t * math.tau * 1.35 + phase) * width * 0.105
        centre_drift += math.sin(t * math.tau * 3.65 + phase * 0.63) * width * 0.035
        # Collapse both ends into soft points.  A broad minimum here makes the
        # object read as a hanging banner; this near-zero taper reads as water.
        end_taper = 0.055 + 0.945 * (math.sin(math.pi * t) ** 0.52)
        left_breath = 0.78 + math.sin(t * math.tau * 2.10 + phase * 1.31) * 0.17
        left_breath += math.sin(t * math.tau * 5.20 + phase) * 0.045
        right_breath = 0.80 + math.sin(t * math.tau * 2.55 + phase * 0.74 + 1.1) * 0.15
        right_breath += math.sin(t * math.tau * 4.60 + phase * 1.2) * 0.04
        left_width = width * 0.5 * end_taper * left_breath
        right_width = width * 0.5 * end_taper * right_breath
        surface_depth = math.sin(t * math.tau * 2.80 + phase) * 0.015
        surface_depth += math.sin(t * math.tau * 6.1 + phase * 0.4) * 0.004
        vertices.extend([
            (surface_depth, centre_drift - left_width, z),
            (surface_depth + 0.004, centre_drift + right_width, z),
        ])
        if segment:
            previous = (segment - 1) * 2
            current = segment * 2
            faces.append((previous, previous + 1, current + 1, current))

    mesh = bpy.data.meshes.new(f"{name}_Mesh")
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    ribbon = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(ribbon)
    ribbon.location = location
    assign_material(ribbon, material)
    solidify = ribbon.modifiers.new("Water membrane", "SOLIDIFY")
    solidify.thickness = 0.008
    solidify.offset = 0.0
    bevel = ribbon.modifiers.new("Water softened edge", "BEVEL")
    bevel.width = 0.004
    bevel.segments = 3
    if hasattr(bevel, "harden_normals"):
        bevel.harden_normals = True
    for polygon in ribbon.data.polygons:
        polygon.use_smooth = True
    mark_web(ribbon)
    return ribbon


def add_demo_water_droplet_chain(
    name: str,
    center: tuple[float, float, float],
    span_y: float,
    span_z: float,
    phase: float,
    material: bpy.types.Material,
) -> bpy.types.Object:
    """Join small irregular ellipsoids into one economical animated stream."""
    randomizer = random.Random(sum(ord(character) for character in name))
    droplets: list[bpy.types.Object] = []
    for index in range(10):
        t = index / 9
        y = center[1] + math.sin(t * math.tau * 1.45 + phase) * span_y * 0.34
        y += randomizer.uniform(-span_y * 0.12, span_y * 0.12)
        z = center[2] - span_z / 2 + t * span_z + randomizer.uniform(-0.08, 0.08)
        x = center[0] + randomizer.uniform(-0.018, 0.020)
        radius = randomizer.uniform(0.030, 0.052)
        droplet = add_sphere(
            f"{name}_Droplet_{index + 1:02d}",
            (x, y, z),
            (radius * 0.48, radius, radius * randomizer.uniform(1.35, 2.05)),
            material,
            segments=16,
            ring_count=10,
        )
        droplets.append(droplet)
    chain = join_meshes(name, droplets, theme_role="water_highlight")
    if chain is None:
        raise RuntimeError(f"Could not build water droplet chain {name}")
    chain["asset_role"] = "water_droplet_stream"
    return chain


def animate_demo_water_flow(
    obj: bpy.types.Object,
    index: int,
    phase: float,
) -> None:
    """Author one seamless two-second transform clip for web playback."""
    obj["animation_role"] = "water_flow"
    obj["animation_clip_hint"] = "Waterfall_Flow_Loop"
    obj["animation_loop"] = True
    obj["animation_duration_seconds"] = 2.0
    obj["flow_axis_blender"] = "-Z"
    obj["flow_axis_gltf"] = "-Y"
    obj["flow_phase"] = round((phase % math.tau) / math.tau, 4)
    base_z = float(obj.location.z)
    base_scale_z = float(obj.scale.z)
    base_rotation_x = float(obj.rotation_euler.x)
    for frame, progress in ((1, 0.0), (13, 0.25), (25, 0.5), (37, 0.75), (49, 1.0)):
        cycle = progress * math.tau + phase
        obj.location.z = base_z + math.sin(cycle) * 0.075
        obj.scale.z = base_scale_z * (1.0 + math.cos(cycle) * 0.024)
        obj.rotation_euler.x = base_rotation_x + math.sin(cycle * 1.0 + 0.7) * math.radians(0.55)
        obj.keyframe_insert(data_path="location", index=2, frame=frame)
        obj.keyframe_insert(data_path="scale", index=2, frame=frame)
        obj.keyframe_insert(data_path="rotation_euler", index=0, frame=frame)
    if obj.animation_data and obj.animation_data.action:
        obj.animation_data.action.name = f"Waterfall_Flow_{index:02d}"


def add_demo_waterfall(
    prefix: str,
    wall_x: float,
    center_y: float,
    materials: dict[str, bpy.types.Material],
    groups: dict[str, list[bpy.types.Object]],
    *,
    feature_scale: float = 1.0,
) -> None:
    # Architectural water wall: sculpted dark stone, layered reflective water,
    # and a deep black-marble catch basin rather than a flat decorative plane.
    inward = -1.0 if wall_x > 0 else 1.0
    floor_reference = 0.54

    def scaled_z(value: float) -> float:
        return floor_reference + (value - floor_reference) * feature_scale

    groups["stone"].append(add_box(
        prefix + "_Stone",
        (wall_x, center_y, scaled_z(2.74)),
        (0.18, 3.10 * feature_scale, 4.62 * feature_scale),
        materials["stone"],
        bevel=0.035,
        theme_role="stone",
    ))

    # The background membrane is a single organic silhouette, not a rectangular
    # glass sheet.  Six overlapping flow veils plus two droplet chains create
    # depth while keeping exactly eight lightweight looped clips.
    membrane = add_demo_water_ribbon(
        prefix + "_Water_Membrane",
        (wall_x + inward * 0.125, center_y, scaled_z(2.72)),
        2.90 * feature_scale,
        4.24 * feature_scale,
        0.37,
        materials["water"],
    )
    membrane["theme_role"] = "water"
    membrane["asset_role"] = "continuous_water_membrane"
    groups["water"].append(membrane)

    flow_specs = (
        (-1.10, 0.34, 3.96, 2.70, 0.15),
        (-0.72, 0.46, 4.14, 2.74, 1.03),
        (-0.30, 0.30, 3.78, 2.62, 2.18),
        (0.12, 0.52, 4.08, 2.76, 3.11),
        (0.55, 0.34, 3.90, 2.67, 4.27),
        (0.98, 0.38, 4.02, 2.73, 5.22),
    )
    for index, (offset_y, width, height, center_z, phase) in enumerate(flow_specs, start=1):
        depth = 0.018 + (index % 3) * 0.009
        ribbon = add_demo_water_ribbon(
            f"{prefix}_Flow_{index:02d}",
            (wall_x + inward * (0.155 - depth * 0.5), center_y + offset_y * feature_scale, scaled_z(center_z)),
            width * feature_scale,
            height * feature_scale,
            phase,
            materials["water_highlight" if index in (2, 4) else "water"],
        )
        ribbon.rotation_euler.y = math.radians((index % 3 - 1) * 0.55)
        ribbon["theme_role"] = "water_highlight" if index in (2, 4) else "water"
        ribbon["asset_role"] = "water_flow"
        ribbon["demo_only"] = True
        animate_demo_water_flow(ribbon, index, phase)
        groups["water_highlight"].append(ribbon)

    for index, (offset_y, phase) in enumerate(((-0.48, 1.48), (0.58, 4.66)), start=7):
        droplets = add_demo_water_droplet_chain(
            f"{prefix}_Droplet_Stream_{index - 6:02d}",
            (wall_x + inward * 0.175, center_y + offset_y * feature_scale, scaled_z(2.46)),
            0.50 * feature_scale,
            3.58 * feature_scale,
            phase,
            materials["water_highlight"],
        )
        animate_demo_water_flow(droplets, index, phase)
        droplets["demo_only"] = True
        groups["water_highlight"].append(droplets)

    # Low splash beads break the final horizontal pool edge and sell impact.
    splash_random = random.Random(2407)
    for index in range(12):
        splash = add_sphere(
            f"{prefix}_Splash_{index + 1:02d}",
            (
                wall_x + inward * (0.73 + splash_random.uniform(-0.16, 0.16)),
                center_y + splash_random.uniform(-1.22, 1.22) * feature_scale,
                0.57 + splash_random.uniform(0.01, 0.17),
            ),
            (
                splash_random.uniform(0.018, 0.032),
                splash_random.uniform(0.028, 0.055),
                splash_random.uniform(0.025, 0.070),
            ),
            materials["water"],
            segments=10,
            ring_count=6,
        )
        splash["asset_role"] = "water_splash"
        groups["water"].append(splash)
    groups["stone"].append(add_box(prefix + "_Basin", (wall_x + inward * 0.50, center_y, 0.25), (1.12, 3.35 * feature_scale, 0.50), materials["stone"], bevel=0.055, theme_role="stone"))
    groups["water"].append(add_box(prefix + "_Pool", (wall_x + inward * 0.64, center_y, 0.52), (0.76, 3.02 * feature_scale, 0.045), materials["water"], bevel=0.025, theme_role="water"))
    groups["emissive"].append(add_box(prefix + "_Top_Light", (wall_x + inward * 0.17, center_y, scaled_z(5.10)), (0.035, 2.82 * feature_scale, 0.045), materials["emissive"], bevel=0.008, theme_role="emissive"))


def add_demo_artwork(
    prefix: str,
    side: str,
    center: tuple[float, float, float],
    image_index: int,
    width: float,
    materials: dict[str, bpy.types.Material],
    groups: dict[str, list[bpy.types.Object]],
) -> None:
    catalogue = ARTWORK_CATALOG[image_index - 1]
    image_material, ratio = create_image_material(
        prefix + "_LOCKED",
        SURFACE_TEXTURES[image_index - 1],
        role="surface_detail_locked",
        maximum_edge=768,
    )
    height = width / ratio
    panel = add_vertical_panel(prefix, side, center, width, height, image_material)
    panel["demo_only"] = True
    panel["asset_role"] = "genuine_artwork_surface_detail"
    panel["asset_id"] = f"demo-artwork-{image_index:02d}"
    panel["artwork_id"] = f"artwork-{image_index:02d}"
    panel["display_label"] = f"{catalogue['title']} · detail"
    panel["title"] = catalogue["title"]
    panel["year"] = catalogue["year"]
    panel["medium"] = catalogue["medium"]
    panel["dimensions"] = catalogue["dimensions"]
    panel["availability"] = catalogue["availability"]
    panel["description"] = catalogue["description"]
    panel["detail_label"] = f"Surface detail · {catalogue['medium']}"
    panel["source_asset"] = str(SURFACE_TEXTURES[image_index - 1].relative_to(ROOT))
    panel["representation"] = "genuine macro/detail photograph; not a complete artwork view"
    panel["display_scale_note"] = "Magnified surface study — not shown to catalogue scale"
    panel["physical_display_not_to_scale"] = True

    # Four real rails, not a solid bronze slab. The previous single-box frame
    # sat one centimetre in front of the image plane and hid the genuine art.
    rail = 0.075
    depth = 0.09
    if side in ("north", "south"):
        frame_y = center[1] + (0.035 if side == "north" else -0.035)
        rail_specs = (
            ((center[0], frame_y, center[2] + height / 2 + rail / 2), (width + rail * 2, depth, rail)),
            ((center[0], frame_y, center[2] - height / 2 - rail / 2), (width + rail * 2, depth, rail)),
            ((center[0] - width / 2 - rail / 2, frame_y, center[2]), (rail, depth, height)),
            ((center[0] + width / 2 + rail / 2, frame_y, center[2]), (rail, depth, height)),
        )
    else:
        frame_x = center[0] + (-0.035 if side == "west" else 0.035)
        rail_specs = (
            ((frame_x, center[1], center[2] + height / 2 + rail / 2), (depth, width + rail * 2, rail)),
            ((frame_x, center[1], center[2] - height / 2 - rail / 2), (depth, width + rail * 2, rail)),
            ((frame_x, center[1] - width / 2 - rail / 2, center[2]), (depth, rail, height)),
            ((frame_x, center[1] + width / 2 + rail / 2, center[2]), (depth, rail, height)),
        )
    for index, (location, dimensions) in enumerate(rail_specs, start=1):
        groups["bronze"].append(add_box(
            f"{prefix}_Frame_Rail_{index:02d}",
            location,
            dimensions,
            materials["bronze"],
            bevel=0.018,
            theme_role="bronze",
        ))


def build_demo_site_rooms(
    materials: dict[str, bpy.types.Material],
    groups: dict[str, list[bpy.types.Object]],
) -> None:
    """Screenshot-led private lounge and Meet & Contact extension."""
    groups["floor"].append(add_box("Demo_Wing_Grout", (0, -12.0, -0.10), (14.0, 8.0, 0.20), materials["floor"], theme_role="floor"))
    for row in range(4):
        for column in range(4):
            x = -5.10 + column * 3.40
            y = -15.02 + row * 1.92
            role = "floor_tile_a" if (row + column) % 2 else "floor_tile_b"
            groups[role].append(add_box(
                f"Demo_Black_Marble_Slab_{row + 1:02d}_{column + 1:02d}",
                (x, y, 0.010),
                (3.36, 1.88, 0.050),
                materials[role],
                bevel=0.014,
                theme_role=role,
            ))

    groups["ceiling"].append(add_box("Demo_Wing_Ceiling", (0, -12.0, ROOM_HEIGHT + 0.12), (14.0, 8.0, 0.24), materials["ceiling"], theme_role="ceiling"))
    groups["wall"].extend([
        add_box("Demo_Wing_West_Wall", (-7.0, -12.0, ROOM_HEIGHT / 2), (0.30, 8.0, ROOM_HEIGHT), materials["wall"], theme_role="wall"),
        add_box("Demo_Wing_East_Wall", (7.0, -12.0, ROOM_HEIGHT / 2), (0.30, 8.0, ROOM_HEIGHT), materials["wall"], theme_role="wall"),
        add_box("Demo_Wing_South_Wall", (0, -16.0, ROOM_HEIGHT / 2), (14.0, 0.30, ROOM_HEIGHT), materials["wall"], theme_role="wall"),
        add_box("Demo_Wing_Partition_North", (0, -9.48, ROOM_HEIGHT / 2), (0.22, 2.96, ROOM_HEIGHT), materials["wall"], theme_role="wall"),
        add_box("Demo_Wing_Partition_South", (0, -14.52, ROOM_HEIGHT / 2), (0.22, 2.96, ROOM_HEIGHT), materials["wall"], theme_role="wall"),
        add_box("Demo_Wing_Partition_Lintel", (0, -12.0, 4.30), (0.22, 2.12, 3.00), materials["wall"], theme_role="wall"),
    ])

    # Walnut slat portals and continuous bronze light lines define transitions.
    for y in (-10.88, -10.62, -13.38, -13.12):
        for z_index in range(10):
            z = 0.34 + z_index * 0.52
            groups["wood"].append(add_box(f"Demo_Walnut_Slat_{y:+.2f}_{z_index:02d}", (0.16, y, z), (0.22, 0.085, 0.40), materials["wood"], bevel=0.008, theme_role="wood"))

    for name, location, dimensions in (
        ("Demo_Cove_West", (-6.72, -12.0, 5.43), (0.04, 7.55, 0.055)),
        ("Demo_Cove_East", (6.72, -12.0, 5.43), (0.04, 7.55, 0.055)),
        ("Demo_Cove_South", (0, -15.68, 5.43), (13.45, 0.04, 0.055)),
        ("Demo_Cove_Private_North", (-3.50, -8.32, 5.43), (6.45, 0.04, 0.055)),
        ("Demo_Cove_Contact_North", (3.50, -8.32, 5.43), (6.45, 0.04, 0.055)),
        ("Demo_Floor_Light_Private", (-3.50, -15.72, 0.28), (6.45, 0.035, 0.04)),
        ("Demo_Floor_Light_Contact", (3.50, -15.72, 0.28), (6.45, 0.035, 0.04)),
    ):
        groups["emissive"].append(add_box(name, location, dimensions, materials["emissive"], bevel=0.008, theme_role="emissive"))

    for x in (-3.5, 3.5):
        groups["shadow"].append(add_box(f"Demo_Ceiling_Track_{x:+.1f}", (x, -12.0, 5.56), (0.06, 6.9, 0.06), materials["shadow"], bevel=0.010, theme_role="shadow"))

    # 02 · Private consultation: the approved walnut library, two-chair table,
    # clear-glass ritual set, pendant and one broad-leaf plant. Everything hugs
    # the outer / partition walls so the 1.2 m circulation spine stays open.
    private_table_center = (-4.50, -12.75)
    add_demo_shelving("Private_Consultation", -6.70, -12.05, materials, groups)
    add_demo_meeting_table("Private_Consultation", private_table_center, materials, groups, angle=math.pi / 2)
    add_demo_decanter_set("Private_Consultation", private_table_center, math.pi / 2, materials, groups)
    add_demo_pendant("Private_Consultation", private_table_center, materials, groups)
    add_lush_botanical(
        "Demo_Private_Botanical",
        (-1.60, -9.05, 0),
        materials,
        groups,
        seed=731,
        planter_role="planter",
        animate=False,
        demo_only=True,
        scale_factor=0.72,
        leaf_count=11,
        leaf_subdivision_levels=0,
    )

    # 03 · Imprint / contact lounge: one armchair and low marble table face an
    # animated water wall. A mineral concrete planter distinguishes this room
    # without adding clutter or narrowing the doorway.
    add_demo_waterfall("Contact_Water_Feature", 6.78, -11.18, materials, groups, feature_scale=0.82)
    add_demo_sofa("Contact_Lounge_Armchair", (4.05, -14.50), math.pi, materials, groups, width=1.12)
    add_demo_coffee_table("Contact_Lounge_Coffee_Table", (4.05, -13.08), materials, groups, scale_factor=0.82)
    add_lush_botanical(
        "Demo_Contact_Botanical",
        (5.62, -14.58, 0),
        materials,
        groups,
        seed=947,
        planter_role="concrete_planter",
        animate=False,
        demo_only=True,
        scale_factor=0.64,
        leaf_count=11,
        leaf_subdivision_levels=0,
    )

    # The former west-wall artwork is intentionally omitted because the
    # walnut consultation library now owns that wall. Real work remains on the
    # north and south walls, clear of the portal and furniture silhouettes.
    # North-wall works sit in the solid outer bays.  Their inner frame edges are
    # beyond x=-4.65 / x=+4.65, safely clear of the 2.12 m entrance portals.
    add_demo_artwork("DEMO_ART_PRIVATE_NORTH", "north", (-5.70, -8.18, 2.84), 6, 1.46 * STANDARD_ARTWORK_SCALE, materials, groups)
    add_demo_artwork("DEMO_ART_CONTACT_NORTH", "north", (5.70, -8.18, 2.84), 2, 1.46 * STANDARD_ARTWORK_SCALE, materials, groups)
    # Sit just proud of the south-wall finish; the structural face is at
    # y=-15.65. This preserves the genuine image texture instead of burying it
    # inside the wall surface.
    add_demo_artwork("DEMO_ART_PRIVATE_SOUTH", "south", (-3.48, -15.59, 3.28), 4, 2.05 * STANDARD_ARTWORK_SCALE, materials, groups)
    add_demo_artwork("DEMO_ART_CONTACT_SOUTH", "south", (3.48, -15.59, 3.18), 5, 2.05 * STANDARD_ARTWORK_SCALE, materials, groups)

    for index, (location, target) in enumerate((
        ((-5.05, -10.15, 5.05), (-5.70, -8.18, 2.84)),
        ((-2.15, -14.45, 5.05), (-3.48, -15.59, 3.28)),
        ((2.55, -12.10, 5.05), (3.48, -15.59, 3.18)),
        ((5.25, -10.05, 5.05), (5.70, -8.18, 2.84)),
    ), start=1):
        light = add_light(
            f"Demo_Room_Spot_{index:02d}", "SPOT", location, target,
            (1.0, 0.76, 0.56), 205, web=True, theme_role="demo_room_spot",
            spot_size=math.radians(38), spot_blend=0.78,
        )
        light["demo_only"] = True
        add_spot_fixture(light, f"Demo_Room_Spot_{index:02d}", materials, groups)

    pendant_light = add_light(
        "Demo_Private_Pendant_Light", "POINT", (-4.50, -12.75, 3.32), (-4.50, -12.75, 0.8),
        (1.0, 0.74, 0.52), 150, web=True, theme_role="demo_pendant",
    )
    pendant_light["demo_only"] = True

    waterfall_light = add_light(
        "Demo_Waterfall_Wash", "SPOT", (5.92, -11.18, 4.72), (6.70, -11.18, 2.45),
        (0.72, 0.83, 0.80), 205, web=True, theme_role="demo_waterfall",
        spot_size=math.radians(52), spot_blend=0.88,
    )
    waterfall_light["demo_only"] = True

    # One economical punctual fill per room lets marble, leather and the clear
    # floor route read between artwork pools.  This is deliberately sparse for
    # mobile; the room keeps its dark cinematic contrast instead of becoming a
    # uniformly lit showroom.
    for name, location, target, energy in (
        ("Demo_Private_Ambient_Fill", (-3.20, -11.65, 4.05), (-4.45, -12.80, 1.45), 165),
        ("Demo_Contact_Ambient_Fill", (3.35, -11.65, 4.05), (4.20, -13.35, 1.45), 155),
    ):
        ambient = add_light(
            name,
            "POINT",
            location,
            target,
            (1.0, 0.76, 0.58),
            energy,
            web=True,
            theme_role="demo_ambient_fill",
        )
        ambient["demo_only"] = True

    # Curated room anchors double as keyboard/mobile shortcuts.
    for order, (name, location, target, label, room_id) in enumerate((
        ("VIEW_Demo_Gallery_Hall", (0, -5.90, CURATED_EYE_HEIGHT), (0, 6.70, 2.72), "01 · Gallery Hall", "gallery-hall"),
        ("VIEW_Demo_Private_Room", (-3.50, -8.45, CURATED_EYE_HEIGHT), (-4.40, -12.90, 2.00), "02 · Private Room", "private-room"),
        ("VIEW_Demo_Contact_Room", (2.35, -9.05, CURATED_EYE_HEIGHT), (4.28, -13.15, 1.76), "03 · Imprint & Contact", "contact-room"),
    ), start=40):
        view = add_view_anchor(name, location, target, label=label, kind="demo_room", order=order)
        target_object = add_empty(
            name.replace("VIEW_", "TARGET_"),
            target,
            display_type="SPHERE",
            display_size=0.15,
        )
        target_object["demo_only"] = True
        target_object["navigation_role"] = "demo_room_look_target"
        view["target_node"] = target_object.name
        view["demo_room_id"] = room_id
        view["demo_only"] = True


def add_navigation_metadata(scene: bpy.types.Scene) -> None:
    xmin, xmax, ymin, ymax = WALK_BOUNDS
    start = add_empty("Walk_Start", (0, -6.42, WALK_EYE_HEIGHT), display_type="ARROWS", display_size=0.42)
    target = add_empty("Walk_LookTarget", (0, 7.38, 2.68), display_type="SPHERE", display_size=0.22)
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
        (0, -0.55, CURATED_EYE_HEIGHT),
        (0, 7.38, 2.68),
        label="Gallery overview",
        kind="overview",
    )

    add_collider("COLLIDER_Wall_North", (0, 7.82, ROOM_HEIGHT / 2), (14.0, 0.36, ROOM_HEIGHT))
    add_collider("COLLIDER_Wall_South_Left", (-5.78, -7.82, ROOM_HEIGHT / 2), (2.44, 0.36, ROOM_HEIGHT))
    add_collider("COLLIDER_Wall_South_Centre", (0, -7.82, ROOM_HEIGHT / 2), (4.88, 0.36, ROOM_HEIGHT))
    add_collider("COLLIDER_Wall_South_Right", (5.78, -7.82, ROOM_HEIGHT / 2), (2.44, 0.36, ROOM_HEIGHT))
    add_collider("COLLIDER_Wall_West", (-6.82, 0, ROOM_HEIGHT / 2), (0.36, 16.0, ROOM_HEIGHT))
    add_collider("COLLIDER_Wall_East", (6.82, 0, ROOM_HEIGHT / 2), (0.36, 16.0, ROOM_HEIGHT))
    add_collider("COLLIDER_Bench", (0, -1.72, 0.45), (3.18, 0.96, 0.90))
    add_collider("COLLIDER_wARTrobe", (0, 7.35, 2.52), (2.75, 0.74, 3.50))
    add_collider("COLLIDER_Plant_West", (-4.62, 6.18, 0.64), (1.15, 1.15, 1.28))
    add_collider("COLLIDER_Plant_East", (4.62, 6.18, 0.64), (1.15, 1.15, 1.28))

    for room_id, x in (("Private", -3.50), ("Contact", 3.50)):
        closure = add_collider(f"COLLIDER_Standard_Door_{room_id}", (x, -7.82, 1.32), (2.04, 0.28, 2.64))
        closure["demo_hidden"] = True

    demo_colliders = [
        add_collider("COLLIDER_Demo_Wall_West", (-6.82, -12.0, ROOM_HEIGHT / 2), (0.36, 8.0, ROOM_HEIGHT)),
        add_collider("COLLIDER_Demo_Wall_East", (6.82, -12.0, ROOM_HEIGHT / 2), (0.36, 8.0, ROOM_HEIGHT)),
        add_collider("COLLIDER_Demo_Wall_South", (0, -15.82, ROOM_HEIGHT / 2), (14.0, 0.36, ROOM_HEIGHT)),
        add_collider("COLLIDER_Demo_Partition_North", (0, -9.48, ROOM_HEIGHT / 2), (0.32, 2.96, ROOM_HEIGHT)),
        add_collider("COLLIDER_Demo_Partition_South", (0, -14.52, ROOM_HEIGHT / 2), (0.32, 2.96, ROOM_HEIGHT)),
        add_collider("COLLIDER_Demo_Private_Table", (-4.50, -12.75, 0.64), (0.96, 2.15, 1.28)),
        add_collider("COLLIDER_Demo_Private_Chair_West", (-5.22, -12.75, 0.55), (0.68, 0.68, 1.10)),
        add_collider("COLLIDER_Demo_Private_Chair_East", (-3.78, -12.75, 0.55), (0.68, 0.68, 1.10)),
        add_collider("COLLIDER_Demo_Private_Shelving", (-6.62, -12.05, 2.40), (0.46, 5.45, 4.80)),
        add_collider("COLLIDER_Demo_Private_Plant", (-1.60, -9.05, 0.46), (0.84, 0.84, 0.92)),
        add_collider("COLLIDER_Demo_Contact_Water", (6.18, -11.18, 0.55), (1.35, 2.92, 1.10)),
        add_collider("COLLIDER_Demo_Contact_Armchair", (4.05, -14.50, 0.60), (1.32, 1.08, 1.20)),
        add_collider("COLLIDER_Demo_Contact_Coffee", (4.05, -13.08, 0.35), (1.23, 0.67, 0.69)),
        add_collider("COLLIDER_Demo_Contact_Plant", (5.62, -14.58, 0.38), (0.70, 0.70, 0.76)),
        add_collider("COLLIDER_Demo_Privacy_Lectern", (-0.61, -9.58, 0.70), (1.14, 1.12, 1.40)),
        add_collider("COLLIDER_Demo_Imprint_Lectern", (0.61, -14.24, 0.70), (1.14, 1.12, 1.40)),
    ]
    for collider in demo_colliders:
        collider["demo_only"] = True

    # Explicit authoring metadata lets the web controller and future audits use
    # the same curated circulation intent.  Both demo routes are 1.2 m wide and
    # begin inside their corresponding 2.12 m entrance opening.
    clear_routes = {
        "private-room": [
            [-3.50, -8.45],
            [-3.05, -10.35],
            [-2.68, -13.30],
            [-2.68, -14.65],
        ],
        "contact-room": [
            [3.50, -8.45],
            [3.00, -10.10],
            [2.55, -12.20],
            [2.55, -14.65],
        ],
    }
    for route_id, points in clear_routes.items():
        for point_index, (x, y) in enumerate(points, start=1):
            waypoint = add_empty(
                f"ROUTE_{route_id.replace('-', '_').upper()}_{point_index:02d}",
                (x, y, 0.03),
                display_type="CIRCLE",
                display_size=0.16,
            )
            waypoint["demo_only"] = True
            waypoint["navigation_role"] = "clear_route_waypoint"
            waypoint["route_id"] = route_id
            waypoint["route_order"] = point_index
            waypoint["clear_width_metres"] = 1.20

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
    scene["demo_room_count"] = 3
    scene["demo_minimum_clear_route_width_metres"] = 1.20
    scene["demo_clear_routes_blender_xy_json"] = json.dumps(clear_routes, separators=(",", ":"))
    scene["demo_entrance_clear_span_metres"] = 2.12
    scene["demo_north_art_jamb_breathing_metres"] = 0.40
    scene["coordinate_note"] = "Blender XYZ maps to glTF/Three X,Y,Z as X,Z,-Y"


def create_preview_camera(scene: bpy.types.Scene) -> None:
    camera_data = bpy.data.cameras.new("Gallery Preview Camera")
    camera = bpy.data.objects.new("Gallery_Preview_Camera", camera_data)
    bpy.context.collection.objects.link(camera)
    camera.location = (0, -6.35, 1.96)
    camera_data.sensor_width = 36.0
    camera_data.lens = 25.0
    camera_data.clip_start = 0.05
    camera_data.clip_end = 70.0
    look_at(camera, Vector((0, 7.38, 2.70)))
    camera["camera_role"] = "non_authoritative_preview"
    mark_web(camera)
    scene.camera = camera


def optimize_groups(
    groups: dict[str, list[bpy.types.Object]],
    *,
    prefix: str = "ARCH",
    demo_only: bool = False,
) -> None:
    roles = {
        "wall": "wall",
        "fabric": "fabric",
        "ceiling": "ceiling",
        "floor": "floor",
        "floor_tile_a": "floor_tile_a",
        "floor_tile_b": "floor_tile_b",
        "floor_alt": "floor_alt",
        "stone": "stone",
        "bronze": "bronze",
        "wayfinding": "wayfinding",
        "shadow": "shadow",
        "emissive": "emissive",
        "bench": "bench",
        "wood": "wood",
        "leather": "leather",
        "leather_seam": "leather_seam",
        "planter": "planter",
        "concrete_planter": "concrete_planter",
        "plaque": "plaque",
        "plaque_text": "plaque_text",
        "stem": "botanical_stem",
        "leaf_a": "botanical_leaf",
        "leaf_b": "botanical_leaf",
        "water": "water",
        "ceramic": "ceramic",
        "glass": "glass",
        "wartrobe_shadow": "shadow",
        "wartrobe_bronze": "bronze",
    }
    for group_name, role in roles.items():
        joined = join_meshes(f"{prefix}_{group_name.title()}", groups[group_name], theme_role=role)
        if joined and demo_only:
            joined["demo_only"] = True
            joined["asset_role"] = "optional_3d_site_architecture"


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
    scene.render.fps = 24
    scene.frame_start = 1
    scene.frame_end = 49
    scene.frame_set(1)

    world = bpy.data.worlds.new("Gallery Atmosphere")
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs["Color"].default_value = rgba("#070908")
    world.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.16
    scene.world = world

    materials = {
        "wall": create_textured_material(
            "Gallery_Rough_Plaster_Wall",
            MATERIAL_TEXTURES["limestone"],
            MATERIAL_BOARD_PRESETS["rough_plaster"]["hex"],
            "#B9B1A7",
            "wall",
            roughness=MATERIAL_BOARD_PRESETS["rough_plaster"]["roughness"],
            specular=MATERIAL_BOARD_PRESETS["rough_plaster"]["specular"],
            uv_repeat=3.0,
        ),
        "fabric": create_textured_material("Gallery_Mineral_Fabric_Display", MATERIAL_TEXTURES["mineral_fabric"], "#8c8780", "#c6bdb2", "fabric", roughness=0.88, uv_repeat=2.0),
        "stone": create_textured_material(
            "Gallery_Polished_Black_Marble_Stone",
            MATERIAL_TEXTURES["black_marble"],
            MATERIAL_BOARD_PRESETS["black_marble"]["hex"],
            "#6C6861",
            "stone",
            roughness=MATERIAL_BOARD_PRESETS["black_marble"]["roughness"],
            specular=MATERIAL_BOARD_PRESETS["black_marble"]["specular"],
            clearcoat=MATERIAL_BOARD_PRESETS["black_marble"]["clearcoat"],
            clearcoat_roughness=0.10,
            uv_repeat=1.0,
        ),
        "ceiling": create_material(
            "Gallery_Matte_Black_Ceiling",
            MATERIAL_BOARD_PRESETS["matte_black"]["hex"],
            "#4B4843",
            "ceiling",
            roughness=MATERIAL_BOARD_PRESETS["matte_black"]["roughness"],
            specular=MATERIAL_BOARD_PRESETS["matte_black"]["specular"],
        ),
        "floor": create_material("Gallery_Black_Grout", "#030403", "#151513", "floor", roughness=0.80, metallic=0.0),
        "floor_tile_a": create_textured_material("Gallery_Polished_Black_Marble_A", MATERIAL_TEXTURES["black_marble"], "#0F0F10", "#68645E", "floor_tile_a", roughness=0.15, metallic=0.0, specular=0.50, clearcoat=0.30, clearcoat_roughness=0.10, uv_repeat=1.0),
        "floor_tile_b": create_textured_material("Gallery_Polished_Black_Marble_B", MATERIAL_TEXTURES["black_marble"], "#0F0F10", "#625F59", "floor_tile_b", roughness=0.15, metallic=0.0, specular=0.50, clearcoat=0.30, clearcoat_roughness=0.10, uv_repeat=1.0),
        "floor_alt": create_textured_material("Gallery_Backlit_Black_Marble", MATERIAL_TEXTURES["black_marble"], "#0F0F10", "#6C6861", "floor_alt", roughness=0.15, metallic=0.0, specular=0.50, clearcoat=0.30, clearcoat_roughness=0.10, uv_repeat=1.0),
        "shadow": create_material("Gallery_Shadow", "#030504", "#4c4943", "shadow", roughness=0.76),
        "bronze": create_material(
            "Gallery_Brushed_Bronze",
            MATERIAL_BOARD_PRESETS["brushed_bronze"]["hex"],
            "#A07C48",
            "bronze",
            roughness=MATERIAL_BOARD_PRESETS["brushed_bronze"]["roughness"],
            metallic=MATERIAL_BOARD_PRESETS["brushed_bronze"]["metallic"],
            specular=MATERIAL_BOARD_PRESETS["brushed_bronze"]["specular"],
            anisotropic=MATERIAL_BOARD_PRESETS["brushed_bronze"]["anisotropic"],
            clearcoat=0.06,
            clearcoat_roughness=0.25,
        ),
        "wayfinding": create_material(
            "Gallery_Bronze_Wayfinding",
            "#6b4d24",
            "#9a7442",
            "wayfinding",
            roughness=0.27,
            metallic=0.72,
            clearcoat=0.16,
            clearcoat_roughness=0.20,
            emission="#5e3b18",
            emission_strength=0.16,
        ),
        "bench": create_material("Gallery_Bench", "#1E1B19", "#6B6258", "bench", roughness=0.70, specular=0.25),
        "wood": create_textured_material("Gallery_Dark_Walnut", MATERIAL_TEXTURES["walnut"], "#4A3222", "#856A52", "wood", roughness=0.45, specular=0.20, clearcoat=0.04, clearcoat_roughness=0.34, uv_repeat=1.4),
        "leather": create_textured_material("Gallery_Dark_Brown_Leather", MATERIAL_TEXTURES["leather"], "#1E1B19", "#696159", "leather", roughness=0.70, specular=0.25, clearcoat=0.03, clearcoat_roughness=0.52, uv_repeat=1.35),
        "leather_seam": create_material("Gallery_Leather_Piping", "#12100F", "#413A34", "leather_seam", roughness=0.72, specular=0.22),
        "planter": create_material("Gallery_Matte_Black_Planter", "#1C1C1C", "#55524D", "planter", roughness=0.60, specular=0.20, metallic=0.02),
        "concrete_planter": create_material("Gallery_Concrete_Planter", "#5C5C55", "#9B978E", "concrete_planter", roughness=0.82, specular=0.22),
        "plaque": create_material("Gallery_Catalogue_Plaque", "#b5aa97", "#ded5c6", "plaque", roughness=0.30, metallic=0.02, clearcoat=0.20, clearcoat_roughness=0.18),
        "plaque_text": create_material("Gallery_Plaque_Engraving", "#2c241a", "#3b3023", "plaque_text", roughness=0.38, metallic=0.58),
        "stem": create_material("Botanical_Stem", "#26351f", "#526044", "botanical_stem", roughness=0.62, clearcoat=0.08),
        "leaf_a": create_material("Botanical_Leaf_Deep_Green", "#244326", "#536e4b", "botanical_leaf", roughness=0.42, clearcoat=0.20, clearcoat_roughness=0.28),
        "leaf_b": create_material("Botanical_Leaf_Olive_Green", "#36592f", "#6d8058", "botanical_leaf", roughness=0.46, clearcoat=0.16, clearcoat_roughness=0.30),
        "water": create_material("Gallery_Reflective_Water", "#405451", "#879995", "water", roughness=0.08, metallic=0.12, clearcoat=0.96, clearcoat_roughness=0.05, emission="#1c302e", emission_strength=0.14),
        "water_highlight": create_material("Gallery_Water_Highlight", "#91a7a2", "#c4d0cd", "water_highlight", roughness=0.12, metallic=0.06, clearcoat=0.92, clearcoat_roughness=0.05, emission="#55706b", emission_strength=0.18),
        "ceramic": create_material("Gallery_Dark_Ceramic", "#171916", "#74716a", "ceramic", roughness=0.32, clearcoat=0.44, clearcoat_roughness=0.18),
        "glass": create_material("Gallery_Clear_Glass", "#FFFFFF", "#FFFFFF", "glass", roughness=0.05, metallic=0.0, specular=0.50, clearcoat=0.20, clearcoat_roughness=0.05),
        "emissive": create_material(
            "Gallery_Warm_Aperture",
            "#806548",
            "#94785B",
            "emissive",
            roughness=0.24,
            metallic=0.12,
            emission="#B88658",
            emission_strength=0.62,
        ),
    }
    # The material board specifies optically clear display glass. Keep it
    # separate from the blue-green water so the pendant and decanter read as
    # glass rather than metal in both Blender and the exported web scene.
    glass_material = materials["glass"]
    glass_material.surface_render_method = "BLENDED"
    glass_material["web_alpha"] = 0.34
    glass_principled = glass_material.node_tree.nodes.get("Principled BSDF")
    set_socket(glass_principled, "Alpha", 0.34)
    set_socket(glass_principled, "Transmission Weight", 0.94)
    set_socket(glass_principled, "Transmission", 0.94)
    set_socket(glass_principled, "IOR", 1.45)

    board_bindings = {
        "wall": "rough_plaster",
        "wood": "dark_walnut",
        "leather": "dark_leather",
        "bench": "dark_leather",
        "floor_tile_a": "black_marble",
        "floor_tile_b": "black_marble",
        "floor_alt": "black_marble",
        "stone": "black_marble",
        "bronze": "brushed_bronze",
        "ceiling": "matte_black",
        "planter": "matte_black",
        "glass": "clear_glass",
        "concrete_planter": "concrete_planter",
    }
    for material_key, preset_key in board_bindings.items():
        material = materials[material_key]
        preset = MATERIAL_BOARD_PRESETS[preset_key]
        material["material_board_preset"] = preset_key
        material["material_board_hex"] = preset["hex"]
        material["material_board_values_json"] = json.dumps(preset, separators=(",", ":"))

    # The board's large-scale albedo should read as a continuous architectural
    # finish rather than a repeated sample swatch.  A future dedicated normal
    # texture may retain the denser micro-detail scales without re-tiling color.
    micro_normal_repeats = {
        "wall": 5.0,
        "stone": 4.0,
        "floor_tile_a": 4.0,
        "floor_tile_b": 4.0,
        "floor_alt": 4.0,
        "wood": 10.0,
        "leather": 8.0,
    }
    for material_key, repeat in micro_normal_repeats.items():
        materials[material_key]["micro_normal_repeat"] = repeat
        materials[material_key]["albedo_repeat"] = materials[material_key].get("uv_repeat", 1.0)
    materials["wall"]["micro_normal_strength"] = 0.08

    # glTF alpha blending lets the layered veils merge into one water volume
    # instead of reading as opaque decorative strips.  The runtime adds moving
    # normals and reflections on top of this physically authored transparency.
    for water_role, alpha, transmission in (
        ("water", 0.56, 0.10),
        ("water_highlight", 0.44, 0.16),
    ):
        water_material = materials[water_role]
        water_material.surface_render_method = "BLENDED"
        water_material["web_alpha"] = alpha
        principled = water_material.node_tree.nodes.get("Principled BSDF")
        set_socket(principled, "Alpha", alpha)
        set_socket(principled, "Transmission Weight", transmission)
        set_socket(principled, "Transmission", transmission)
    groups = {name: [] for name in (
        "wall", "fabric", "stone", "ceiling", "floor", "floor_tile_a", "floor_tile_b", "floor_alt", "shadow", "bronze", "wayfinding",
        "emissive", "bench", "wood", "leather", "leather_seam", "planter", "concrete_planter", "plaque", "plaque_text", "stem", "leaf_a", "leaf_b", "water", "water_highlight", "ceramic", "glass",
        "wartrobe_shadow", "wartrobe_bronze",
    )}
    demo_groups = {name: [] for name in groups}

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

    build_demo_site_rooms(materials, demo_groups)
    wayfinding_piece_count = add_floor_wayfinding(materials, demo_groups)
    add_site_information_panels(materials, demo_groups)
    # The full spatial experience now owns a persistent vertical DOM
    # navigator.  The former physical centre-pier console duplicated it,
    # obscured both entrance views under the HUD, and is intentionally omitted.

    add_lush_botanical("Botanical_West", (-4.62, 6.18, 0), materials, groups, seed=1963)
    add_lush_botanical("Botanical_East", (4.62, 6.18, 0), materials, groups, seed=2026)
    for side, x in (("West", -4.62), ("East", 4.62)):
        botanical_light = add_light(
            f"Botanical_Spot_{side}",
            "SPOT",
            (x * 0.82, 4.25, 5.15),
            (x, 6.18, 2.10),
            (1.0, 0.76, 0.56),
            66,
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
        (1.0, 0.76, 0.58),
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
    optimize_groups(demo_groups, prefix="DEMO", demo_only=True)
    scene.frame_set(1)

    scene["experience_name"] = "Danny Hirsch Arts — Material Orbit"
    scene["experience_version"] = 3
    scene["architecture_truth"] = "Blender-modeled spatial interpretation; not a 3D scan"
    scene["artwork_truth"] = "Six portals are genuine surface-detail photographs, not complete work simulations"
    scene["wartrobe_truth"] = "wARTrobe focal surface uses genuine complete front photograph gallery-04"
    scene["surface_count"] = 6
    scene["catalogue_label_count"] = 6
    scene["site_demo_panel_count"] = len(SITE_PANELS)
    scene["site_navigation_embedded"] = False
    scene["site_navigation_strategy"] = "persistent accessible DOM sidebar; no physical centre-pier console"
    scene["waterfall_animation_clip"] = "Waterfall_Flow_Loop"
    scene["waterfall_animation_duration_seconds"] = 2.0
    scene["waterfall_animation_frame_range"] = [1, 49]
    scene["waterfall_animation_strategy"] = "six overlapping organic flow veils and two droplet streams over one tapered membrane; eight seamless transform clips"
    scene["waterfall_room"] = "03 · Imprint / Contact Lounge"
    scene["botanical_animation_clip_count"] = 4
    scene["botanical_animation_strategy"] = "four isolated hero leaves with sub-two-degree seamless breeze; static foliage remains batched"
    scene["demo_ambient_fill_count"] = 2
    scene["demo_ambient_fill_strategy"] = "one warm punctual fill per secondary room for mobile-safe material readability"
    scene["material_board_revision"] = "2026-07-27-four-board-room-refinement"
    scene["approved_material_presets_json"] = json.dumps(MATERIAL_BOARD_PRESETS, separators=(",", ":"))
    scene["room_material_plan_json"] = json.dumps({
        "gallery-hall": ["rough_plaster", "dark_walnut", "black_marble", "brushed_bronze", "dark_leather", "matte_black"],
        "private-room": ["rough_plaster", "dark_walnut", "dark_leather", "black_marble", "brushed_bronze", "clear_glass", "matte_black"],
        "contact-room": ["rough_plaster", "black_marble", "dark_leather", "brushed_bronze", "clear_glass", "concrete_planter", "matte_black"],
    }, separators=(",", ":"))
    scene["material_texture_strategy"] = "low-repeat architectural albedo; original board scale retained as micro-normal metadata"
    scene["demo_room_lighting_kelvin"] = 3000
    scene["wayfinding_piece_count"] = wayfinding_piece_count
    scene["wayfinding_strategy"] = "low-emission patinated-bronze floor line and three chevrons; visual only, no collision geometry"
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


def export_glb(scene: bpy.types.Scene, output_path: Path) -> None:
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
        filepath=str(output_path),
        export_format="GLB",
        use_selection=True,
        export_cameras=True,
        export_lights=True,
        export_extras=True,
        export_animations=True,
        export_animation_mode="SCENE",
        export_frame_range=True,
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
    # One canonical runtime GLB avoids shipping duplicate 5 MB scene assets.
    export_glb(scene, GLB_PATH)
    mesh_count = sum(1 for obj in scene.objects if obj.get("web_export") and obj.type == "MESH")
    node_count = sum(1 for obj in scene.objects if obj.get("web_export"))
    print(f"BLEND={BLEND_PATH}")
    print(f"GLB={GLB_PATH}")
    print(f"WEB_NODES={node_count}")
    print(f"WEB_MESHES={mesh_count}")


if __name__ == "__main__":
    main()
