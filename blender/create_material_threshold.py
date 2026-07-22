"""Build Danny Hirsch Arts' reproducible Material Threshold scene.

Run from the repository root:

    /Applications/Blender.app/Contents/MacOS/Blender \
      --background --factory-startup \
      --python blender/create_material_threshold.py

Add ``-- --render-video`` to rebuild both seven-second H.264 and VP9 openings,
or ``-- --render-webm`` to rebuild only the Chromium-compatible VP9 fallback.

The scene deliberately uses the genuine, front-facing wARTrobe photograph and
its genuine close-detail photograph as its only art-bearing surfaces. The
surrounding room is an architectural stage, not a claim that a photogrammetry
scan exists.
"""

from __future__ import annotations

import math
import random
import shutil
import subprocess
import sys
from pathlib import Path

import bpy
from mathutils import Vector


ROOT = Path(__file__).resolve().parents[1]
OUTPUT_DIR = ROOT / "assets" / "cinematic"
PREVIEW_DIR = ROOT / "artifacts" / "previews"
TEXTURE = ROOT / "assets" / "gallery" / "gallery-04.jpg"
DETAIL_TEXTURE = ROOT / "assets" / "gallery" / "gallery-08.jpg"
BLEND_PATH = ROOT / "blender" / "danny-material-threshold.blend"
GLB_PATH = OUTPUT_DIR / "threshold-room.glb"

FRAME_START = 1
FRAME_OBJECT = 88
FRAME_ROOM = 168


def clean_scene() -> None:
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for datablocks in (
        bpy.data.meshes,
        bpy.data.curves,
        bpy.data.materials,
        bpy.data.cameras,
        bpy.data.lights,
    ):
        for datablock in list(datablocks):
            if datablock.users == 0:
                datablocks.remove(datablock)


def rgba(hex_value: str, alpha: float = 1.0) -> tuple[float, float, float, float]:
    value = hex_value.lstrip("#")
    rgb = tuple(int(value[i : i + 2], 16) / 255 for i in (0, 2, 4))
    # Blender's node colors are scene-linear. Convert simple sRGB hex values.
    linear = tuple(c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4 for c in rgb)
    return (*linear, alpha)


def set_socket(node: bpy.types.Node, name: str, value) -> None:
    socket = node.inputs.get(name)
    if socket is not None:
        socket.default_value = value


def material(
    name: str,
    color: str,
    *,
    roughness: float = 0.5,
    metallic: float = 0.0,
    emission: str | None = None,
    emission_strength: float = 0.0,
) -> bpy.types.Material:
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    principled = mat.node_tree.nodes.get("Principled BSDF")
    set_socket(principled, "Base Color", rgba(color))
    set_socket(principled, "Roughness", roughness)
    set_socket(principled, "Metallic", metallic)
    if emission:
        set_socket(principled, "Emission Color", rgba(emission))
        set_socket(principled, "Emission Strength", emission_strength)
    return mat


def add_micro_surface(
    mat: bpy.types.Material,
    *,
    scale: float = 7.0,
    detail: float = 4.0,
    roughness: float = 0.65,
    strength: float = 0.16,
    distance: float = 0.08,
) -> bpy.types.Material:
    """Add restrained procedural relief so architectural planes catch real light."""
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    principled = nodes.get("Principled BSDF")
    if not principled:
        return mat
    noise = nodes.new("ShaderNodeTexNoise")
    noise.name = f"{mat.name}_micro_texture"
    set_socket(noise, "Scale", scale)
    set_socket(noise, "Detail", detail)
    set_socket(noise, "Roughness", roughness)
    bump = nodes.new("ShaderNodeBump")
    bump.name = f"{mat.name}_micro_relief"
    set_socket(bump, "Strength", strength)
    set_socket(bump, "Distance", distance)
    links.new(noise.outputs["Fac"], bump.inputs["Height"])
    links.new(bump.outputs["Normal"], principled.inputs["Normal"])
    return mat


def textured_material(name: str, image_path: Path) -> bpy.types.Material:
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    principled = nodes.get("Principled BSDF")
    tex = nodes.new("ShaderNodeTexImage")
    tex.name = "Genuine_wARTrobe_Front"
    tex.label = "Genuine wARTrobe photograph — gallery-04.jpg"
    tex.image = bpy.data.images.load(str(image_path), check_existing=True)
    tex.image.colorspace_settings.name = "sRGB"
    tex.interpolation = "Linear"
    links.new(tex.outputs["Color"], principled.inputs["Base Color"])
    set_socket(principled, "Roughness", 0.48)
    set_socket(principled, "Metallic", 0.0)
    # A tiny emission contribution keeps the documentary image readable while
    # the frame and room receive the dramatic lighting.
    emission_input = principled.inputs.get("Emission Color")
    if emission_input is not None:
        links.new(tex.outputs["Color"], emission_input)
        set_socket(principled, "Emission Strength", 0.14)
    return mat


def detail_overlay_material(image_path: Path) -> bpy.types.Material:
    """A genuine wARTrobe detail that dissolves into the complete front view."""
    mat = bpy.data.materials.new("WARTROBE_Detail_Transition")
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    nodes.clear()
    output = nodes.new("ShaderNodeOutputMaterial")
    transparent = nodes.new("ShaderNodeBsdfTransparent")
    emission = nodes.new("ShaderNodeEmission")
    texture = nodes.new("ShaderNodeTexImage")
    texture.image = bpy.data.images.load(str(image_path), check_existing=True)
    texture.image.colorspace_settings.name = "sRGB"
    texture.interpolation = "Linear"
    mix = nodes.new("ShaderNodeMixShader")
    mat.node_tree.links.new(texture.outputs["Color"], emission.inputs["Color"])
    emission.inputs["Strength"].default_value = 0.78
    mat.node_tree.links.new(transparent.outputs["BSDF"], mix.inputs[1])
    mat.node_tree.links.new(emission.outputs["Emission"], mix.inputs[2])
    mat.node_tree.links.new(mix.outputs["Shader"], output.inputs["Surface"])
    factor = mix.inputs[0]
    factor.default_value = 1.0
    factor.keyframe_insert("default_value", frame=FRAME_START)
    factor.keyframe_insert("default_value", frame=8)
    factor.default_value = 0.0
    factor.keyframe_insert("default_value", frame=28)
    if hasattr(mat, "surface_render_method"):
        mat.surface_render_method = "DITHERED"
    return mat


def assign_material(obj: bpy.types.Object, mat: bpy.types.Material) -> None:
    if obj.data and hasattr(obj.data, "materials"):
        obj.data.materials.append(mat)


def mark_web(obj: bpy.types.Object) -> bpy.types.Object:
    obj["web_export"] = True
    return obj


def add_box(
    name: str,
    location: tuple[float, float, float],
    dimensions: tuple[float, float, float],
    mat: bpy.types.Material,
    *,
    bevel: float = 0.0,
    web: bool = True,
) -> bpy.types.Object:
    bpy.ops.mesh.primitive_cube_add(location=location)
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = dimensions
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    assign_material(obj, mat)
    if bevel:
        modifier = obj.modifiers.new("Architectural edge", "BEVEL")
        modifier.width = bevel
        modifier.segments = 3
    if web:
        mark_web(obj)
    return obj


def add_cylinder(
    name: str,
    location: tuple[float, float, float],
    radius: float,
    depth: float,
    mat: bpy.types.Material,
    *,
    vertices: int = 24,
    web: bool = True,
) -> bpy.types.Object:
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth, location=location)
    obj = bpy.context.object
    obj.name = name
    assign_material(obj, mat)
    if web:
        mark_web(obj)
    return obj


def look_at(obj: bpy.types.Object, target: Vector) -> None:
    direction = target - obj.location
    obj.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()


def add_light(
    name: str,
    light_type: str,
    location: tuple[float, float, float],
    target: tuple[float, float, float],
    color: tuple[float, float, float],
    energy: float,
    *,
    spot_size: float = math.radians(38),
    spot_blend: float = 0.55,
    web: bool = True,
) -> bpy.types.Object:
    data = bpy.data.lights.new(name=name, type=light_type)
    data.color = color
    data.energy = energy
    if light_type == "SPOT":
        data.spot_size = spot_size
        data.spot_blend = spot_blend
        data.shadow_soft_size = 0.35
    elif light_type == "AREA":
        data.shape = "RECTANGLE"
        data.size = 4.0
        data.size_y = 2.0
    obj = bpy.data.objects.new(name, data)
    bpy.context.collection.objects.link(obj)
    obj.location = location
    look_at(obj, Vector(target))
    if web:
        mark_web(obj)
    return obj


def add_front_surface(mat: bpy.types.Material) -> bpy.types.Object:
    bpy.ops.mesh.primitive_plane_add(location=(0.0, 3.420, 2.62), rotation=(math.pi / 2, 0.0, 0.0))
    front = bpy.context.object
    front.name = "WARTROBE_Genuine_Surface"
    # 3:4 ratio matches the source exactly and prevents distortion.
    front.scale = (1.71, 2.28, 1.0)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    assign_material(front, mat)
    front["asset_role"] = "genuine_wartrobe_front_photograph"
    front["source_asset"] = "assets/gallery/gallery-04.jpg"
    front["representation"] = "spatial interpretation; not a 3D scan"
    mark_web(front)
    return front


def add_detail_overlay(mat: bpy.types.Material) -> bpy.types.Object:
    # Screen-aligned detail plate: the whole high-resolution macro remains
    # sharp, then dissolves within the first second to reveal the 3D object.
    bpy.ops.mesh.primitive_plane_add(location=(0.0, 0.0, 0.0))
    detail = bpy.context.object
    detail.name = "Render_wARTrobe_Detail_Transition"
    # gallery-08 is 4:3; keep that ratio exactly while the camera crops it.
    detail.scale = (0.12, 0.09, 1.0)
    assign_material(detail, mat)
    detail["asset_role"] = "genuine_wartrobe_macro_detail"
    detail["source_asset"] = "assets/gallery/gallery-08.jpg"
    return detail


def add_dust(emissive_mat: bpy.types.Material) -> None:
    random.seed(63)
    for index in range(22):
        x = random.uniform(-5.0, 5.0)
        y = random.uniform(-5.2, 3.0)
        z = random.uniform(0.35, 6.1)
        # Keep particles away from the object's face so its image stays exact.
        if y > 2.2 and abs(x) < 2.1:
            x += 2.5 if x >= 0 else -2.5
        radius = random.uniform(0.004, 0.012)
        bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=radius, location=(x, y, z))
        particle = bpy.context.object
        particle.name = f"Render_Dust_{index:02d}"
        assign_material(particle, emissive_mat)


def keyframe_camera(camera: bpy.types.Object, target: bpy.types.Object) -> None:
    camera_points = {
        FRAME_START: ((-0.68, 3.04, 2.86), 55.0, 2.2),
        44: ((-0.42, 1.92, 2.80), 66.0, 2.4),
        FRAME_OBJECT: ((-0.10, -3.60, 2.72), 29.0, 3.2),
        126: ((0.22, -6.25, 2.86), 30.0, 4.5),
        FRAME_ROOM: ((0.0, -8.65, 2.96), 28.0, 5.6),
    }
    target_points = {
        FRAME_START: (-0.68, 3.42, 2.86),
        44: (-0.36, 3.42, 2.78),
        FRAME_OBJECT: (0.0, 3.55, 2.56),
        126: (0.05, 3.60, 2.48),
        FRAME_ROOM: (0.0, 3.65, 2.42),
    }
    for frame, (location, lens, fstop) in camera_points.items():
        camera.location = location
        camera.rotation_euler = (
            Vector(target_points[frame]) - Vector(location)
        ).to_track_quat("-Z", "Y").to_euler()
        camera.data.lens = lens
        camera.data.dof.aperture_fstop = fstop
        camera.keyframe_insert(data_path="location", frame=frame)
        # Export the real orientation. glTF does not evaluate Blender's
        # TRACK_TO constraint, which otherwise leaves the web camera looking
        # straight into the ceiling/floor instead of toward the artwork.
        camera.keyframe_insert(data_path="rotation_euler", frame=frame)
        camera.data.keyframe_insert(data_path="lens", frame=frame)
        camera.data.dof.keyframe_insert(data_path="aperture_fstop", frame=frame)
    for frame, location in target_points.items():
        target.location = location
        target.keyframe_insert(data_path="location", frame=frame)

    # Blender's default Bezier interpolation supplies the slow cinematic ease.
    # Blender 5's layered Action API intentionally stays untouched here so the
    # generator remains compatible with both 4.x and 5.x releases.


def build_scene() -> bpy.types.Scene:
    clean_scene()
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    PREVIEW_DIR.mkdir(parents=True, exist_ok=True)
    assert TEXTURE.exists(), f"Missing source-of-truth image: {TEXTURE}"
    assert DETAIL_TEXTURE.exists(), f"Missing genuine detail image: {DETAIL_TEXTURE}"

    scene = bpy.context.scene
    scene.name = "Material Threshold"
    scene.frame_start = FRAME_START
    scene.frame_end = FRAME_ROOM
    scene.render.fps = 24
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_x = 1280
    scene.render.resolution_y = 720
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "JPEG"
    scene.render.image_settings.quality = 91
    scene.render.film_transparent = False
    scene.render.use_file_extension = True
    scene.render.image_settings.color_mode = "RGB"
    scene.render.image_settings.color_depth = "8"
    scene.render.ffmpeg.format = "MPEG4"
    scene.render.ffmpeg.codec = "H264"
    scene.render.ffmpeg.constant_rate_factor = "MEDIUM"
    scene.render.ffmpeg.ffmpeg_preset = "GOOD"
    scene.render.ffmpeg.audio_codec = "NONE"
    scene.view_settings.look = "AgX - Medium High Contrast"
    scene.view_settings.exposure = -0.62

    world = bpy.data.worlds.new("Threshold Atmosphere")
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs["Color"].default_value = rgba("#050708")
    world.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.09
    scene.world = world

    black_stone = add_micro_surface(material("Room_Architecture", "#111312", roughness=0.5, metallic=0.04), scale=5.2, strength=0.2)
    wall_mat = add_micro_surface(material("Room_Wall", "#171918", roughness=0.83), scale=3.4, detail=5.5, strength=0.12, distance=0.12)
    ceiling_mat = material("Room_Ceiling", "#0c0e0e", roughness=0.62, metallic=0.02)
    recess_mat = material("Room_Shadow", "#050606", roughness=0.72)
    bronze = material("Object_Frame", "#574427", roughness=0.34, metallic=0.72)
    floor_a = add_micro_surface(material("Room_Floor", "#111210", roughness=0.30, metallic=0.12), scale=8.0, strength=0.13, distance=0.045)
    floor_b = add_micro_surface(material("Room_Floor_Alt", "#181713", roughness=0.38, metallic=0.08), scale=6.8, strength=0.11, distance=0.05)
    bench_mat = add_micro_surface(material("Room_Bench", "#171511", roughness=0.38), scale=16.0, detail=3.0, strength=0.08, distance=0.025)
    emissive = material(
        "Warm aperture",
        "#7b5520",
        roughness=0.25,
        metallic=0.2,
        emission="#d2a052",
        emission_strength=3.0,
    )
    dust_mat = material(
        "Suspended pigment",
        "#8f754c",
        roughness=1.0,
        emission="#bd9456",
        emission_strength=0.65,
    )
    surface_mat = textured_material("WARTROBE_Surface_LOCKED", TEXTURE)
    detail_mat = detail_overlay_material(DETAIL_TEXTURE)

    # Room shell and modular stone floor.
    add_box("Room_BackWall", (0.0, 4.22, 3.6), (16.6, 0.34, 7.2), wall_mat, bevel=0.025)
    add_box("Room_LeftWall", (-8.15, -1.65, 3.6), (0.34, 12.0, 7.2), black_stone)
    add_box("Room_RightWall", (8.15, -1.65, 3.6), (0.34, 12.0, 7.2), black_stone)
    add_box("Room_Ceiling", (0.0, -1.65, 7.12), (16.6, 12.0, 0.28), ceiling_mat)
    add_box("Room_ShadowGap", (0.0, 3.94, 0.17), (15.8, 0.10, 0.11), bronze, bevel=0.012)
    add_box("Floor_Base", (0.0, -1.65, -0.11), (16.6, 12.0, 0.22), recess_mat)
    for column in range(8):
        for row in range(7):
            x = -7.16 + column * 2.05
            y = -6.55 + row * 1.68
            z = 0.008 + ((column + row) % 3) * 0.002
            floor_mat = floor_a if (column + row) % 2 else floor_b
            add_box(
                f"Floor_Slab_{column:02d}_{row:02d}",
                (x, y, z),
                (1.96, 1.59, 0.07),
                floor_mat,
                bevel=0.018,
            )

    # A deep reveal makes the wARTrobe read as a singular object, not a card.
    add_box("Object_Recess", (0.0, 4.025, 3.10), (7.9, 0.18, 5.9), recess_mat, bevel=0.05)
    add_box("Portal_Left", (-4.22, 3.80, 3.26), (0.50, 0.68, 6.52), black_stone, bevel=0.04)
    add_box("Portal_Right", (4.22, 3.80, 3.26), (0.50, 0.68, 6.52), black_stone, bevel=0.04)
    add_box("Portal_Header", (0.0, 3.80, 6.24), (8.94, 0.68, 0.58), black_stone, bevel=0.04)

    # Object carcass, documentary surface and restrained bronze perimeter.
    add_box("WARTROBE_Carcass", (0.0, 3.69, 2.62), (3.58, 0.46, 4.76), recess_mat, bevel=0.035)
    add_box("WARTROBE_LeftSide", (-1.79, 3.70, 2.62), (0.10, 0.50, 4.78), bronze, bevel=0.018)
    add_box("WARTROBE_RightSide", (1.79, 3.70, 2.62), (0.10, 0.50, 4.78), bronze, bevel=0.018)
    add_box("WARTROBE_Top", (0.0, 3.70, 5.01), (3.66, 0.50, 0.10), bronze, bevel=0.018)
    add_box("WARTROBE_Plinth", (0.0, 3.70, 0.22), (3.76, 0.58, 0.18), bronze, bevel=0.025)
    add_front_surface(surface_mat)
    detail_overlay = add_detail_overlay(detail_mat)

    # Curatorial bench anchors scale without inviting game-like navigation.
    add_box("Bench_Seat", (0.0, -1.72, 0.63), (3.62, 0.94, 0.22), bench_mat, bevel=0.11)
    add_box("Bench_ShadowCore", (0.0, -1.72, 0.42), (3.16, 0.66, 0.20), recess_mat, bevel=0.075)
    for x in (-1.36, 1.36):
        add_box(f"Bench_Foot_{x:+.0f}", (x, -1.72, 0.22), (0.16, 0.68, 0.44), bronze, bevel=0.035)

    # Track and fixtures.
    add_box("Track_Rail", (0.0, 0.72, 6.76), (7.70, 0.075, 0.075), recess_mat, bevel=0.02)
    warm = (1.0, 0.70, 0.34)
    for index, x in enumerate((-2.85, 0.0, 2.85), start=1):
        target = (x * 0.46, 3.48, 2.35)
        spot = add_light(
            f"Track_Spot_{index}",
            "SPOT",
            (x, 0.70, 6.48),
            target,
            warm,
            1050 if index == 2 else 760,
            spot_size=math.radians(36 if index == 2 else 31),
            spot_blend=0.63,
        )
        housing = add_cylinder(f"Spot_Housing_{index}", spot.location, 0.20, 0.31, black_stone)
        housing.rotation_euler = spot.rotation_euler
        aperture = add_cylinder(f"Spot_Aperture_{index}", spot.location, 0.12, 0.315, emissive)
        aperture.rotation_euler = spot.rotation_euler

    # Render-only soft key/fills; punctual lights above remain in the GLB.
    add_light("Render_Key", "AREA", (-2.6, -0.4, 5.7), (0.0, 3.5, 2.6), (1.0, 0.62, 0.29), 760, web=False)
    add_light("Render_Fill", "AREA", (4.4, -1.8, 3.7), (0.7, 3.3, 2.3), (0.30, 0.49, 0.72), 390, web=False)
    add_light("Render_Rim", "AREA", (-5.4, 2.8, 4.2), (-1.4, 2.8, 2.7), (0.65, 0.77, 1.0), 260, web=False)

    # Very restrained pigment motes only in the cinematic render, never in the GLB.
    add_dust(dust_mat)

    # A low-density world volume gives the spotlights a real atmospheric body.
    volume_mat = bpy.data.materials.new("Gallery atmosphere")
    volume_mat.use_nodes = True
    volume_nodes = volume_mat.node_tree.nodes
    volume_nodes.clear()
    output = volume_nodes.new("ShaderNodeOutputMaterial")
    volume = volume_nodes.new("ShaderNodeVolumePrincipled")
    set_socket(volume, "Color", rgba("#6d604b"))
    set_socket(volume, "Density", 0.010)
    set_socket(volume, "Anisotropy", 0.28)
    volume_mat.node_tree.links.new(volume.outputs["Volume"], output.inputs["Volume"])
    add_box("Render_Atmosphere", (0.0, -1.20, 3.45), (15.3, 10.3, 6.65), volume_mat, web=False)

    target = bpy.data.objects.new("Camera_Target", None)
    bpy.context.collection.objects.link(target)
    mark_web(target)
    camera_data = bpy.data.cameras.new("Material Threshold Camera")
    camera = bpy.data.objects.new("Camera", camera_data)
    bpy.context.collection.objects.link(camera)
    camera_data.sensor_width = 36.0
    camera_data.clip_start = 0.02
    camera_data.clip_end = 120.0
    # The opening must preserve pigment detail. Depth comes from parallax and
    # light; disabling optical blur also keeps the fallback frames crisp.
    camera_data.dof.use_dof = False
    camera_data.dof.focus_object = target
    mark_web(camera)
    scene.camera = camera
    keyframe_camera(camera, target)
    detail_overlay.parent = camera
    detail_overlay.location = (0.0, 0.0, -0.35)
    detail_overlay.rotation_euler = (0.0, 0.0, 0.0)

    scene["experience_name"] = "Material Threshold"
    scene["asset_truth"] = "wARTrobe front is gallery-04.jpg; room is a digital spatial interpretation"
    scene["web_fallback"] = "assets/cinematic/threshold-poster.webp"
    scene.frame_set(FRAME_ROOM)
    return scene


def save_render(
    scene: bpy.types.Scene,
    frame: int,
    output_path: Path,
    *,
    resolution: tuple[int, int] | None = None,
) -> None:
    scene.frame_set(frame)
    previous_resolution = (scene.render.resolution_x, scene.render.resolution_y)
    if resolution:
        scene.render.resolution_x, scene.render.resolution_y = resolution
    suffix = output_path.suffix.lower()
    scene.render.image_settings.file_format = "WEBP" if suffix == ".webp" else "JPEG"
    scene.render.image_settings.quality = 91 if suffix == ".webp" else 88
    scene.render.filepath = str(output_path)
    bpy.ops.render.render(write_still=True)
    scene.render.resolution_x, scene.render.resolution_y = previous_resolution


def render_private_room_views(scene: bpy.types.Scene) -> None:
    """Bake three high-quality viewpoints for responsive, photographic web depth."""
    camera = scene.camera
    original_location = camera.location.copy()
    original_rotation = camera.rotation_euler.copy()
    original_lens = camera.data.lens
    target = Vector((0.0, 3.58, 2.48))
    views = {
        "left": (-1.15, -8.25, 3.04),
        "center": (0.0, -8.72, 2.96),
        "right": (1.15, -8.25, 3.04),
    }
    scene.frame_set(FRAME_ROOM)
    camera.data.lens = 29.0
    for name, location in views.items():
        camera.location = location
        look_at(camera, target)
        save_render(
            scene,
            FRAME_ROOM,
            OUTPUT_DIR / f"threshold-room-{name}.webp",
            resolution=(1800, 1125),
        )
    camera.location = original_location
    camera.rotation_euler = original_rotation
    camera.data.lens = original_lens


def render_private_room_light_view(scene: bpy.types.Scene) -> None:
    """Create a genuine light-gallery render instead of filtering the dark room in CSS."""
    camera = scene.camera
    original_location = camera.location.copy()
    original_rotation = camera.rotation_euler.copy()
    original_lens = camera.data.lens
    original_exposure = scene.view_settings.exposure
    world_background = scene.world.node_tree.nodes.get("Background")
    original_world_color = world_background.inputs["Color"].default_value[:]
    original_world_strength = world_background.inputs["Strength"].default_value
    material_state = []
    light_state = []
    palette = {
        "Room_Architecture": "#8e877d",
        "Room_Wall": "#b8afa2",
        "Room_Ceiling": "#81796e",
        "Room_Floor": "#746d62",
        "Room_Floor_Alt": "#8c8376",
        "Room_Shadow": "#4c4942",
    }
    for mat in bpy.data.materials:
        principled = mat.node_tree.nodes.get("Principled BSDF") if mat.use_nodes else None
        base = principled.inputs.get("Base Color") if principled else None
        if base:
            material_state.append((base, base.default_value[:]))
            for prefix, color in palette.items():
                if mat.name.startswith(prefix):
                    base.default_value = rgba(color)
                    break
    for light in scene.objects:
        if light.type != "LIGHT":
            continue
        light_state.append((light.data, light.data.energy))
        light.data.energy *= 1.28
    scene.view_settings.exposure = 0.18
    world_background.inputs["Color"].default_value = rgba("#8e877a")
    world_background.inputs["Strength"].default_value = 0.32
    scene.frame_set(FRAME_ROOM)
    camera.location = (0.0, -8.72, 2.96)
    camera.data.lens = 29.0
    look_at(camera, Vector((0.0, 3.58, 2.48)))
    save_render(scene, FRAME_ROOM, OUTPUT_DIR / "threshold-room-light.webp", resolution=(1800, 1125))
    for socket, value in material_state:
        socket.default_value = value
    for light, energy in light_state:
        light.energy = energy
    world_background.inputs["Color"].default_value = original_world_color
    world_background.inputs["Strength"].default_value = original_world_strength
    scene.view_settings.exposure = original_exposure
    camera.location = original_location
    camera.rotation_euler = original_rotation
    camera.data.lens = original_lens


def export_glb() -> None:
    # The camera-attached macro plate is render-only. A selected camera causes
    # Blender's glTF exporter to include unselected children as hierarchy;
    # detach it so its unsupported animated mix shader cannot become an opaque
    # white sheet over the live WebGL room.
    render_children = [
        obj for obj in bpy.context.scene.objects
        if obj.name.startswith("Render_") and obj.parent is not None
    ]
    saved_parents = {obj: obj.parent for obj in render_children}
    for obj in render_children:
        obj.parent = None

    bpy.ops.object.select_all(action="DESELECT")
    for obj in bpy.context.scene.objects:
        if obj.get("web_export"):
            obj.select_set(True)
    bpy.context.view_layer.objects.active = bpy.data.objects.get("WARTROBE_Genuine_Surface")
    try:
        bpy.ops.export_scene.gltf(
            filepath=str(GLB_PATH),
            export_format="GLB",
            use_selection=True,
            export_cameras=True,
            export_lights=True,
            export_extras=True,
            export_animations=True,
            export_animation_mode="SCENE",
            export_frame_range=True,
            export_image_format="WEBP",
            export_image_quality=82,
            export_image_webp_fallback=False,
            export_materials="EXPORT",
            export_texcoords=True,
            export_normals=True,
            export_tangents=False,
            export_yup=True,
            export_apply=False,
            check_existing=False,
        )
    finally:
        for obj, parent in saved_parents.items():
            obj.parent = parent


def render_video(scene: bpy.types.Scene) -> None:
    """Render the optional seven-second cinematic master as browser-ready H.264."""
    # Blender 5.2 does not allow switching directly from WEBP to FFMPEG via
    # Python. A clean child process uses the saved scene and the supported CLI
    # format switch, then the frame-range suffix is normalized for the website.
    stem = OUTPUT_DIR / "threshold-intro"
    exact = OUTPUT_DIR / "threshold-intro.mp4"
    for stale in OUTPUT_DIR.glob("threshold-intro*.mp4"):
        if stale.is_file():
            stale.unlink()
    subprocess.run(
        [
            bpy.app.binary_path,
            str(BLEND_PATH),
            "--background",
            "-o",
            str(stem),
            "-F",
            "FFMPEG",
            "--python-expr",
            (
                "import bpy; s=bpy.context.scene; "
                "s.render.ffmpeg.format='MPEG4'; "
                "s.render.ffmpeg.codec='H264'; "
                "s.render.ffmpeg.constant_rate_factor='MEDIUM'; "
                "s.render.ffmpeg.ffmpeg_preset='GOOD'; "
                "s.render.ffmpeg.audio_codec='NONE'"
            ),
            "-s",
            str(FRAME_START),
            "-e",
            str(FRAME_ROOM),
            "-a",
        ],
        check=True,
    )
    candidates = sorted(OUTPUT_DIR.glob("threshold-intro*.mp4"))
    if not candidates:
        raise RuntimeError("Blender did not create the expected MP4")
    candidates[-1].replace(exact)
    # macOS ships avconvert; a passthrough remux moves the MP4 metadata to the
    # front so browsers can begin playback before the whole file downloads.
    avconvert = shutil.which("avconvert")
    if avconvert:
        fast = OUTPUT_DIR / "threshold-intro-fast.mp4"
        subprocess.run(
            [
                avconvert,
                "--source",
                str(exact),
                "--preset",
                "PresetPassthrough",
                "--output",
                str(fast),
                "--replace",
                "--disableMetadataFilter",
            ],
            check=True,
        )
        fast.replace(exact)


def render_webm(scene: bpy.types.Scene) -> None:
    """Render the same seven-second master as a Chromium-friendly VP9 WebM."""
    stem = OUTPUT_DIR / "threshold-intro-webm"
    exact = OUTPUT_DIR / "threshold-intro.webm"
    for stale in OUTPUT_DIR.glob("threshold-intro*.webm"):
        if stale.is_file():
            stale.unlink()
    subprocess.run(
        [
            bpy.app.binary_path,
            str(BLEND_PATH),
            "--background",
            "-o",
            str(stem),
            "-F",
            "FFMPEG",
            "--python-expr",
            (
                "import bpy; s=bpy.context.scene; "
                "s.render.ffmpeg.format='WEBM'; "
                "s.render.ffmpeg.codec='WEBM'; "
                "s.render.ffmpeg.constant_rate_factor='VERYLOW'; "
                "s.render.ffmpeg.ffmpeg_preset='GOOD'; "
                "s.render.ffmpeg.audio_codec='NONE'"
            ),
            "-s",
            str(FRAME_START),
            "-e",
            str(FRAME_ROOM),
            "-a",
        ],
        check=True,
    )
    candidates = sorted(OUTPUT_DIR.glob("threshold-intro*.webm"))
    if not candidates:
        raise RuntimeError("Blender did not create the expected WebM")
    candidates[-1].replace(exact)


def main() -> None:
    # Avoid littering source control with automatic .blend1 backup files; the
    # generator itself is the reproducible source of truth.
    bpy.context.preferences.filepaths.save_version = 0
    scene = build_scene()
    bpy.ops.wm.save_as_mainfile(filepath=str(BLEND_PATH), compress=True)
    save_render(scene, FRAME_START, PREVIEW_DIR / "threshold-01-surface.jpg")
    save_render(scene, FRAME_OBJECT, PREVIEW_DIR / "threshold-02-object.jpg")
    save_render(scene, FRAME_ROOM, PREVIEW_DIR / "threshold-03-room.jpg")
    # The final room composition is the resilient no-WebGL/no-motion poster.
    save_render(
        scene,
        FRAME_ROOM,
        OUTPUT_DIR / "threshold-poster.webp",
        resolution=(1600, 900),
    )
    render_private_room_views(scene)
    render_private_room_light_view(scene)
    export_glb()
    if "--render-video" in sys.argv:
        render_video(scene)
        render_webm(scene)
    elif "--render-webm" in sys.argv:
        render_webm(scene)
    scene.frame_set(FRAME_ROOM)
    print(f"BLEND={BLEND_PATH}")
    print(f"GLB={GLB_PATH}")
    print(f"POSTER={OUTPUT_DIR / 'threshold-poster.webp'}")


if __name__ == "__main__":
    main()
