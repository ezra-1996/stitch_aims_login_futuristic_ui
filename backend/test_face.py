import cv2
import numpy as np
import urllib.request
from ai_services.face_recognition.face_verification_light import LightFaceVerification
import logging
logging.basicConfig(level=logging.INFO)

print('Initializing Face Verifier...')
verifier = LightFaceVerification()

print('Downloading a sample face image...')
url = 'https://raw.githubusercontent.com/opencv/opencv/master/samples/data/lena.jpg'
req = urllib.request.urlopen(url)
arr = np.asarray(bytearray(req.read()), dtype=np.uint8)
img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

print('Testing Face Enrollment...')
success, msg = verifier.enroll_student('test_student_999', img_rgb)
print('Enroll result:', success, msg)

print('Testing Face Verification...')
verified, conf, details = verifier.verify_student('test_student_999', img_rgb)
print('Verify result:', verified, conf, details)
