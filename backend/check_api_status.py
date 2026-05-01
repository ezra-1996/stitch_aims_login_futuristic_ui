import logging
import os
from decouple import config

# Set up logging to capture output
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

try:
    import google.generativeai as genai
    HAS_GENAI = True
except ImportError:
    HAS_GENAI = False

GEMINI_API_KEY = config('GEMINI_API_KEY', default=None)

def check_gemini_limit():
    if not HAS_GENAI:
        print("Gemini SDK not installed.")
        return
    
    if not GEMINI_API_KEY:
        print("GEMINI_API_KEY not found in .env")
        return
    
    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel('gemini-2.0-flash')
    
    print(f"Testing Gemini API with key: {GEMINI_API_KEY[:5]}...{GEMINI_API_KEY[-5:]}")
    
    try:
        response = model.generate_content("Hello, this is a connectivity test. Please respond with 'OK'.")
        print(f"Response: {response.text}")
        print("STATUS: API is working correctly. Limit NOT reached.")
    except Exception as e:
        print(f"ERROR: {e}")
        if "429" in str(e):
            print("STATUS: API limit REACHED (429 Too Many Requests).")
        elif "quota" in str(e).lower():
            print("STATUS: API quota EXCEEDED.")
        else:
            print("STATUS: API failed for another reason (see error above).")

if __name__ == "__main__":
    check_gemini_limit()
