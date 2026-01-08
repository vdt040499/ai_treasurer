"""Database configuration and client."""
from supabase import create_client, Client
from app.core.config import settings

# Prefer service role key for backend (bypasses RLS), fallback to anon key
key: str = settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_KEY

if not settings.SUPABASE_URL or not key:
    raise ValueError(
        "SUPABASE_URL and SUPABASE_KEY (or SUPABASE_SERVICE_ROLE_KEY) must be set in environment variables"
    )

supabase: Client = create_client(settings.SUPABASE_URL, key)


def get_supabase_client() -> Client:
    """
    Get Supabase client instance.
    
    Returns:
        Supabase client
    """
    return supabase