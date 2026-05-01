import sys, os
sys.path.insert(0, '.')
import cv2, numpy as np

# Import directly from the file, not through the package
import importlib.util
spec = importlib.util.spec_from_file_location(
    "face_verification_light",
    "ai_services/face_recognition/face_verification_light.py"
)
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)
LightFaceVerification = mod.LightFaceVerification

# Create verifier manually (bypass Django)
verifier = LightFaceVerification()
verifier.match_threshold = 0.45

def get_face(img_path):
    img = cv2.imread(img_path)
    if img is None:
        return None
    img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    return verifier._extract_face_gray(img_rgb)

photos = {
    'dv14': 'media/profile_photos/dv14.jpg',
    'dv14_dup': 'media/profile_photos/dv14_Bqcbhom.jpg',
    'dv14_v2': 'media/profile_photos/dv14_j4qMrPC.jpg',
    'student1': 'media/profile_photos/student_1_profile.png',
    'photo24': 'media/profile_photos/photo_2026-04-24_14-26-26.jpg',
}

faces = {}
for name, path in photos.items():
    f = get_face(path)
    if f is not None:
        faces[name] = f
        print(f'{name}: face detected')
    else:
        print(f'{name}: NO face detected')

print('\n--- Cross-Person Comparison ---')
keys = list(faces.keys())
for i in range(len(keys)):
    for j in range(i+1, len(keys)):
        score, details = verifier._compute_similarity(faces[keys[i]], faces[keys[j]])
        label = "MATCH" if score >= 0.45 else "NO MATCH"
        print(f'{keys[i]:12s} vs {keys[j]:12s}: score={score:.4f} -> {label}  '
              f'(Hg={details["histogram_grid"]:.3f} T={details["template_score"]:.3f} O={details["orb_score"]:.3f})')

# Self-match
score, _ = verifier._compute_similarity(faces['dv14'], faces['dv14'])
print(f'\ndv14 vs SELF: score={score:.4f}')

# Robustness
print('\n--- Same-Person Variations ---')
img_orig = cv2.imread('media/profile_photos/dv14.jpg')
orig_face = get_face('media/profile_photos/dv14.jpg')

for label, transform in [
    ('Bright+30', lambda i: np.clip(i.astype(np.int16) + 30, 0, 255).astype(np.uint8)),
    ('Dark-30', lambda i: np.clip(i.astype(np.int16) - 30, 0, 255).astype(np.uint8)),
    ('Blur5x5', lambda i: cv2.GaussianBlur(i, (5,5), 0)),
    ('Noise', lambda i: np.clip(i.astype(np.int16) + np.random.randint(-10,10,i.shape), 0, 255).astype(np.uint8)),
]:
    modified = transform(img_orig)
    mod_rgb = cv2.cvtColor(modified, cv2.COLOR_BGR2RGB)
    mod_face = verifier._extract_face_gray(mod_rgb)
    if mod_face is not None:
        score, details = verifier._compute_similarity(orig_face, mod_face)
        tag = "MATCH" if score >= 0.45 else "NO MATCH"
        print(f'Original vs {label:10s}: score={score:.4f} -> {tag}  '
              f'(Hg={details["histogram_grid"]:.3f} T={details["template_score"]:.3f} O={details["orb_score"]:.3f})')
