from PIL import Image

from app.ml.disease_model import disease_model
from app.ml.skin_type_model import skin_type_model
from app.utils.response_formatter import get_confidence_level, round_confidence


def run_disease_prediction(image: Image.Image) -> dict:
    prediction = disease_model.predict(image)

    confidence = round_confidence(prediction.confidence)

    return {
        "predicted_disease": prediction.label,
        "disease_confidence": confidence,
        "disease_confidence_level": get_confidence_level(confidence),
    }


def run_skin_type_prediction(image: Image.Image) -> dict:
    prediction = skin_type_model.predict(image)

    confidence = round_confidence(prediction.confidence)

    return {
        "predicted_skin_type": prediction.label,
        "skin_type_confidence": confidence,
        "skin_type_confidence_level": get_confidence_level(confidence),
    }


def run_image_diagnosis(image: Image.Image) -> dict:
    disease_result = run_disease_prediction(image)
    skin_type_result = run_skin_type_prediction(image)

    return {
        **disease_result,
        **skin_type_result,
    }