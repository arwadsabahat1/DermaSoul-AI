from app.config import settings
import os

print("Diagnosis Model Path:", settings.DIAGNOSIS_MODEL_PATH)
print("File exists:", os.path.exists(settings.DIAGNOSIS_MODEL_PATH))
print()
print("Skin Type Model Path:", settings.SKIN_TYPE_MODEL_PATH)
print("File exists:", os.path.exists(settings.SKIN_TYPE_MODEL_PATH))
