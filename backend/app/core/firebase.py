import firebase_admin
from firebase_admin import credentials, firestore
from pathlib import Path

# Path to Firebase service account JSON
BASE_DIR = Path(__file__).resolve().parents[2]
SERVICE_ACCOUNT_FILE = (
    BASE_DIR / "student-4d01f-firebase-adminsdk-fbsvc-ac1ee90757.json"
)

# Initialize Firebase only once
if not firebase_admin._apps:
    cred = credentials.Certificate(str(SERVICE_ACCOUNT_FILE))
    firebase_admin.initialize_app(cred)

def get_firebase_db():
    return firestore.client()
