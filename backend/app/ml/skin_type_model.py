import os

import torch
from PIL import Image
from torchvision.models import efficientnet_b1

from app.config import settings
from app.ml.class_labels import SKIN_TYPE_LABELS
from app.ml.preprocessing import skin_type_transform


class SkinTypePredictionResult:
    def __init__(self, label: str, confidence: float):
        self.label = label
        self.confidence = confidence


class SkinTypeModel:
    def __init__(self):
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.model = None
        self.labels = SKIN_TYPE_LABELS
        self.model_path = settings.SKIN_TYPE_MODEL_PATH

    def load_model(self):
        if self.model is not None:
            return self.model

        if not os.path.exists(self.model_path):
            raise FileNotFoundError(
                f"Skin type model file not found at: {self.model_path}"
            )

        model = efficientnet_b1(weights=None, num_classes=len(self.labels))

        checkpoint = torch.load(
            self.model_path,
            map_location=self.device
        )

        if isinstance(checkpoint, dict) and "model_state_dict" in checkpoint:
            state_dict = checkpoint["model_state_dict"]
        else:
            state_dict = checkpoint

        model.load_state_dict(state_dict, strict=True)
        model.to(self.device)
        model.eval()

        self.model = model
        return self.model

    @torch.no_grad()
    def predict(self, image: Image.Image) -> SkinTypePredictionResult:
        model = self.load_model()

        input_tensor = skin_type_transform(image).unsqueeze(0).to(self.device)

        logits = model(input_tensor)
        probabilities = torch.softmax(logits, dim=1)[0]

        predicted_index = int(torch.argmax(probabilities).item())
        confidence = float(probabilities[predicted_index].item())

        label = (
            self.labels[predicted_index]
            if predicted_index < len(self.labels)
            else f"class_{predicted_index}"
        )

        return SkinTypePredictionResult(
            label=label,
            confidence=confidence
        )


skin_type_model = SkinTypeModel()