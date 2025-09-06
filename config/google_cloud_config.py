"""
Google Cloud Configuration for SIAM

Handles Google Cloud Speech-to-Text API configuration, including
credentials management and service initialization.
"""

import os
from pathlib import Path
from typing import Optional


class GoogleCloudConfig:
    """Google Cloud configuration manager."""
    
    # Default paths to check for credentials
    DEFAULT_CREDENTIAL_PATHS = [
        "config/google-credentials.json",
        "google-credentials.json", 
        os.path.expanduser("~/.config/gcloud/application_default_credentials.json"),
        os.path.expanduser("~/siam-google-credentials.json")
    ]
    
    def __init__(self):
        self.credentials_path = None
        self.project_id = None
        
        # Auto-detect credentials
        self._detect_credentials()
    
    def _detect_credentials(self) -> None:
        """Auto-detect Google Cloud credentials."""
        # Check environment variable first
        env_creds = os.getenv('GOOGLE_APPLICATION_CREDENTIALS')
        if env_creds and os.path.exists(env_creds):
            self.credentials_path = env_creds
            return
        
        # Check default paths
        project_root = Path(__file__).parent.parent
        for rel_path in self.DEFAULT_CREDENTIAL_PATHS:
            if rel_path.startswith('/') or rel_path.startswith('~'):
                full_path = Path(rel_path).expanduser()
            else:
                full_path = project_root / rel_path
            
            if full_path.exists():
                self.credentials_path = str(full_path)
                return
    
    def set_credentials_path(self, path: str) -> bool:
        """
        Set custom credentials path.
        
        Args:
            path: Path to Google Cloud credentials JSON file
            
        Returns:
            True if path exists and is valid
        """
        if os.path.exists(path):
            self.credentials_path = path
            return True
        return False
    
    def is_configured(self) -> bool:
        """Check if Google Cloud is properly configured."""
        return self.credentials_path is not None
    
    def get_credentials_path(self) -> Optional[str]:
        """Get the current credentials path."""
        return self.credentials_path
    
    def setup_instructions(self) -> str:
        """Get setup instructions for Google Cloud credentials."""
        return """
Google Cloud Speech-to-Text Setup Instructions:

1. Go to Google Cloud Console: https://console.cloud.google.com/
2. Create a new project or select existing project
3. Enable the Speech-to-Text API
4. Create a service account:
   - Go to IAM & Admin > Service Accounts
   - Click "Create Service Account"
   - Give it a name like "siam-transcription"
   - Grant "Speech-to-Text Admin" role
5. Create and download JSON key:
   - Click on the service account
   - Go to "Keys" tab
   - Click "Add Key" > "Create new key" > "JSON"
   - Save the file as "google-credentials.json"

6. Place the credentials file in one of these locations:
   - config/google-credentials.json (in SIAM project directory)
   - ~/siam-google-credentials.json (in your home directory)
   - Or set GOOGLE_APPLICATION_CREDENTIALS environment variable

7. Install dependencies:
   pip install google-cloud-speech>=2.20.0

The system will automatically detect your credentials once configured.
        """.strip()


# Global config instance
google_config = GoogleCloudConfig()


def get_google_credentials_path() -> Optional[str]:
    """Get the current Google Cloud credentials path."""
    return google_config.get_credentials_path()


def is_google_cloud_configured() -> bool:
    """Check if Google Cloud is configured."""
    return google_config.is_configured()


def print_setup_instructions() -> None:
    """Print Google Cloud setup instructions."""
    print(google_config.setup_instructions())


if __name__ == "__main__":
    # Test configuration
    if is_google_cloud_configured():
        print(f"✅ Google Cloud configured: {get_google_credentials_path()}")
    else:
        print("❌ Google Cloud not configured")
        print_setup_instructions()
