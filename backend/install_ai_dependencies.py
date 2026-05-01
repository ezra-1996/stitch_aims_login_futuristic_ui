"""
AI Dependencies Installation Script
Run this to install all required AI packages
"""

import subprocess
import sys
import os

def install_ai_dependencies():
    """Install AI dependencies with proper error handling"""
    
    requirements = [
        "torch==2.1.2",
        "torchvision==0.16.2", 
        "numpy==1.24.3",
        "scipy==1.10.1",
        "scikit-learn==1.3.2",
        "opencv-python==4.8.1.78",
        "Pillow==10.0.1",
        "transformers==4.35.2",
        "sentence-transformers==2.2.2",
        "language-tool-python==2.7.1",
        "nltk==3.8.1",
        "deepface==0.0.79",
        "requests==2.31.0",
        "tqdm==4.66.1"
    ]
    
    print("Installing AI dependencies...")
    
    for package in requirements:
        try:
            print(f"Installing {package}...")
            subprocess.check_call([sys.executable, "-m", "pip", "install", package])
            print(f"✓ {package} installed successfully")
        except subprocess.CalledProcessError as e:
            print(f"✗ Failed to install {package}: {e}")
    
    print("\nAI dependencies installation completed!")

if __name__ == "__main__":
    install_ai_dependencies()
