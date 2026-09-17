import os
import sys
from pathlib import Path

# Add project root directory to Python path
CURRENT_DIR = Path(__file__).resolve().parent
BASE_DIR = CURRENT_DIR.parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

from django.core.wsgi import get_wsgi_application
from django.core.management import call_command

app = get_wsgi_application()

# On Vercel serverless environment, ensure database schema & sample data are initialized in /tmp
try:
    db_file = Path('/tmp') / 'db.sqlite3'
    if not db_file.exists():
        call_command('migrate', interactive=False)
        call_command('seed_students')
except Exception as e:
    print("Vercel DB initialization warning:", e)
