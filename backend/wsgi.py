"""
WSGI config for backend project.

It exposes the WSGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/6.1/howto/deployment/wsgi/
"""

import os

from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

application = get_wsgi_application()
app = application

# If executing in Vercel serverless runtime, initialize schema and seed in /tmp
if os.environ.get('VERCEL'):
    from pathlib import Path
    from django.core.management import call_command
    db_file = Path('/tmp') / 'db.sqlite3'
    if not db_file.exists():
        try:
            call_command('migrate', interactive=False)
            call_command('seed_students')
        except Exception as e:
            print("Vercel initial migration log:", e)
