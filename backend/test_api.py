import google.generativeai as genai
from django.conf import settings
import os

# Load Django settings to get the API key
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core_project.settings')
import django
django.setup()

# Configure the API key from your settings
API_KEY = settings.GEMINI_API_KEY
if not API_KEY:
    print("Error: API key not found. Please check settings.py")
else:
    genai.configure(api_key=API_KEY)

    try:
        print("Testing API connection...")
        # Attempt to list models to verify the key
        for m in genai.list_models():
            print(f"- Found model: {m.name}")
    except Exception as e:
        print(f"An error occurred: {e}")
        print("\nPossible reasons:")
        print("1. Your API key is incorrect.")
        print("2. There's a network issue.")
        print("3. Your region does not support the Gemini API yet.")