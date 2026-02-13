from supabase import create_client, Client
import os
import io

# Your Supabase credentials
SUPABASE_URL = "https://aws-1.ap-south-1.pooler.supabase.com"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVwYW56Z2Nyc3dqdWFndWRoaXNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5Njk3NjMsImV4cCI6MjA4NjU0NTc2M30.5XhaDuulL75kQo3Oj4sfbDk_5vkTKuKmtBAbTq8HNME"

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

class SupabaseStorage:
    @staticmethod
    def upload_glb(project_id: int, model_id: int, glb_data: bytes, version: str = "latest"):
        """Upload edited GLB to Supabase Storage"""
        file_path = f"projects/{project_id}/models/{model_id}/{version}.glb"
        file_name = f"{model_id}_{version}.glb"
        
        with open(file_name, "wb") as f:
            f.write(glb_data)
        
        with open(file_name, "rb") as f:
            res = supabase.storage.from_("glb-models").upload(file_path, f)
        
        os.remove(file_name)
        return supabase.storage.from_("glb-models").get_public_url(file_path).strip('"')
    
    @staticmethod
    def get_latest_glb(model_id: int):
        """Get latest version of edited GLB"""
        # List files for this model
        files = supabase.storage.from_("glb-models").list(f"projects/*/models/{model_id}/")
        if files['data']:
            latest_file = max(files['data'], key=lambda x: x['updated_at'])
            return supabase.storage.from_("glb-models").get_public_url(latest_file['name']).strip('"')
        return None
