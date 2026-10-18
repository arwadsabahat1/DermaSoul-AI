from app.ml.disease_model import disease_model
from app.ml.skin_type_model import skin_type_model
from PIL import Image
import numpy as np

# Create a simple test image locally
print("Creating test image...")
img_array = np.random.randint(0, 256, (300, 300, 3), dtype=np.uint8)
test_image = Image.fromarray(img_array)
test_image.save("test_image.jpg")

print("Testing Disease Model...")
try:
    disease_result = disease_model.predict(test_image)
    print(f"✓ Disease: {disease_result.label}, Confidence: {disease_result.confidence:.4f}")
except Exception as e:
    print(f"✗ Error: {e}")
    import traceback
    traceback.print_exc()

print("\nTesting Skin Type Model...")
try:
    skin_result = skin_type_model.predict(test_image)
    print(f"✓ Skin Type: {skin_result.label}, Confidence: {skin_result.confidence:.4f}")
except Exception as e:
    print(f"✗ Error: {e}")
    import traceback
    traceback.print_exc()
