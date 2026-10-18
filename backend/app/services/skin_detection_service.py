import cv2
import numpy as np
from fastapi import HTTPException, status
from PIL import Image


# Laplacian variance falls as resolution rises (the same edge spreads over more pixels), so a
# sharp 3000px phone photo of smooth skin scored as "blurry". Measuring at a fixed working size,
# close to the classifier's 300x300 input, makes the score resolution-independent.
BLUR_WORKING_SIZE = 384
# At the working size, sharp samples scored >= 30 and Gaussian-blurred ones (radius >= 2) <= 11.6.
BLUR_THRESHOLD = 12.0


def calculate_blur_score(image: Image.Image) -> float:
    working = image.copy()
    working.thumbnail((BLUR_WORKING_SIZE, BLUR_WORKING_SIZE), Image.LANCZOS)  # downscale only
    image_array = np.array(working)
    gray = cv2.cvtColor(image_array, cv2.COLOR_RGB2GRAY)
    blur_score = cv2.Laplacian(gray, cv2.CV_64F).var()
    return float(blur_score)


def validate_image_not_blurry(image: Image.Image, threshold: float = BLUR_THRESHOLD) -> float:
    blur_score = calculate_blur_score(image)

    if blur_score < threshold:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Image appears blurry. Blur score: {round(blur_score, 2)}. Please upload a clearer photo of the affected skin area."
        )

    return blur_score


def calculate_skin_ratio_ycrcb(image: Image.Image) -> float:
    image_array = np.array(image)

    bgr_image = cv2.cvtColor(image_array, cv2.COLOR_RGB2BGR)
    ycrcb_image = cv2.cvtColor(bgr_image, cv2.COLOR_BGR2YCrCb)

    lower_skin = np.array([0, 133, 77], dtype=np.uint8)
    upper_skin = np.array([255, 173, 127], dtype=np.uint8)

    skin_mask = cv2.inRange(ycrcb_image, lower_skin, upper_skin)

    skin_pixels = cv2.countNonZero(skin_mask)
    total_pixels = image_array.shape[0] * image_array.shape[1]

    if total_pixels == 0:
        return 0.0

    return skin_pixels / total_pixels


def calculate_skin_ratio_hsv(image: Image.Image) -> float:
    image_array = np.array(image)

    hsv_image = cv2.cvtColor(image_array, cv2.COLOR_RGB2HSV)

    lower_skin_1 = np.array([0, 20, 40], dtype=np.uint8)
    upper_skin_1 = np.array([25, 255, 255], dtype=np.uint8)

    lower_skin_2 = np.array([160, 20, 40], dtype=np.uint8)
    upper_skin_2 = np.array([180, 255, 255], dtype=np.uint8)

    mask_1 = cv2.inRange(hsv_image, lower_skin_1, upper_skin_1)
    mask_2 = cv2.inRange(hsv_image, lower_skin_2, upper_skin_2)

    skin_mask = cv2.bitwise_or(mask_1, mask_2)

    skin_pixels = cv2.countNonZero(skin_mask)
    total_pixels = image_array.shape[0] * image_array.shape[1]

    if total_pixels == 0:
        return 0.0

    return skin_pixels / total_pixels


def calculate_edge_density(image: Image.Image) -> float:
    image_array = np.array(image)
    gray = cv2.cvtColor(image_array, cv2.COLOR_RGB2GRAY)
    edges = cv2.Canny(gray, 80, 180)
    total_pixels = image_array.shape[0] * image_array.shape[1]
    if total_pixels == 0:
        return 0.0
    return float(cv2.countNonZero(edges) / total_pixels)


def validate_visible_skin(image: Image.Image) -> dict:
    ycrcb_ratio = calculate_skin_ratio_ycrcb(image)
    hsv_ratio = calculate_skin_ratio_hsv(image)
    edge_density = calculate_edge_density(image)

    combined_ratio = max(ycrcb_ratio, hsv_ratio)
    minimum_ratio = min(ycrcb_ratio, hsv_ratio)

    if combined_ratio < 0.03:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No visible skin area detected. Please upload a clear photo of the affected skin area."
        )

    # Guard against UI screenshots/non-skin scenes that can spoof one color-space threshold.
    if combined_ratio < 0.05 and minimum_ratio < 0.02:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded image does not look like a close skin photo. Please upload a clear photo of the affected skin area only."
        )

    # UI screenshots typically have many hard edges and low genuine skin coverage.
    if edge_density > 0.045 and combined_ratio < 0.08:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Image appears to be a screenshot or non-skin scene. Please upload a direct skin photo."
        )

    return {
        "ycrcb_skin_ratio": round(ycrcb_ratio, 4),
        "hsv_skin_ratio": round(hsv_ratio, 4),
        "combined_skin_ratio": round(combined_ratio, 4),
        "edge_density": round(edge_density, 4),
    }