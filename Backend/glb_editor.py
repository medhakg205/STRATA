from pygltflib import GLTF2, ImageFormat
import requests
import io

class GLBEditor:
    @staticmethod
    def load_public_glb(url):
        """Download GLB from public URL"""
        response = requests.get(url)
        response.raise_for_status()
        return GLTF2().load_from_buffer(response.content)
    
    @staticmethod
    def modify_material(gltf, mesh_index=0, primitive_index=0, color=None):
        """Modify material color of mesh"""
        if mesh_index < len(gltf.meshes):
            primitive = gltf.meshes[mesh_index].primitives[primitive_index]
            if color:  # color is [r,g,b]
                material_idx = primitive.material
                if material_idx < len(gltf.materials):
                    material = gltf.materials[material_idx]
                    material.pbrMetallicRoughness.baseColorFactor = [*color, 1.0]
        return gltf
    
    @staticmethod
    def save_glb(gltf, output_path):
        """Save modified GLB"""
        gltf.save(output_path)
        with open(output_path, "rb") as f:
            return f.read()
