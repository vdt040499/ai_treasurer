from app.core.database import get_supabase_client
from app.models import  UserCreate

class UserService:
    def __init__(self):
        self.client = get_supabase_client()
        self.table_name = "users"

    def get_users(self):
        response = self.client.table(self.table_name).select("*").order("created_at", desc=True).execute()
        return response.data

    def create_user(self, user: UserCreate):
        response = self.client.table(self.table_name).insert(user.model_dump()).execute()

        # Supabase returns a list, but we need to return a single user object
        return response.data[0] if response.data else None