"""Application configuration."""
import os
from pathlib import Path
from dotenv import load_dotenv
from typing import Optional

# Load .env file from the backend directory
env_path = Path(__file__).parent.parent.parent / '.env'
load_dotenv(dotenv_path=env_path)


class Settings:
    """Application settings."""
    
    # Database settings
    SUPABASE_URL: Optional[str] = os.environ.get("SUPABASE_URL")
    SUPABASE_KEY: Optional[str] = os.environ.get("SUPABASE_KEY")
    SUPABASE_SERVICE_ROLE_KEY: Optional[str] = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    
    # Google AI settings
    GOOGLE_API_KEY: Optional[str] = os.environ.get("GOOGLE_API_KEY")
    
    # CORS settings
    CORS_ORIGINS: list[str] = os.environ.get("CORS_ORIGINS", "*").split(",")
    
    # Application settings
    APP_NAME: str = "AI Treasurer API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = os.environ.get("DEBUG", "False").lower() == "true"
    
    @classmethod
    def validate(cls) -> None:
        """Validate required settings."""
        required_settings = {
            "SUPABASE_URL": cls.SUPABASE_URL,
            "SUPABASE_KEY": cls.SUPABASE_KEY or cls.SUPABASE_SERVICE_ROLE_KEY,
            "GOOGLE_API_KEY": cls.GOOGLE_API_KEY,
        }
        
        missing = [key for key, value in required_settings.items() if not value]
        if missing:
            raise ValueError(
                f"Missing required environment variables: {', '.join(missing)}"
            )


# Global settings instance
settings = Settings()

