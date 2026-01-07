import os
from supabase import create_client, Client
from dotenv import load_dotenv
from pathlib import Path

# Load .env file from the backend directory
env_path = Path(__file__).parent.parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")

supabase: Client = create_client(url, key)

def get_supabase_client() -> Client:
    return supabase