"""
PaddleOCR service for HuggingFace Spaces (Gradio SDK - free tier).
Exposes both a Gradio UI and a REST API endpoint at /api/ocr.
"""
import base64
import io
import json

import gradio as gr
import numpy as np
from fastapi import Request
from fastapi.responses import JSONResponse
from PIL import Image
from paddleocr import PaddleOCR

# Initialize PaddleOCR
ocr = PaddleOCR(use_textline_orientation=True, lang="en")


def run_ocr_on_image(img_np: np.ndarray) -> tuple[str, list[str]]:
    """Run PaddleOCR on a numpy image array and return (raw_text, lines)."""
    result = ocr.ocr(img_np, cls=True)
    extracted_texts = []
    if result and result[0]:
        for line in result[0]:
            text = line[1][0]
            confidence = line[1][1]
            if confidence > 0.5:
                extracted_texts.append(text)
    raw_text = "\n".join(extracted_texts)
    return raw_text, extracted_texts


def gradio_ocr(image):
    """Gradio interface function: takes an image, returns extracted text."""
    if image is None:
        return "No image provided"
    img_np = np.array(image)
    raw_text, _ = run_ocr_on_image(img_np)
    return raw_text if raw_text else "No text detected"


# Gradio UI (required for free Gradio SDK spaces)
demo = gr.Interface(
    fn=gradio_ocr,
    inputs=gr.Image(type="pil", label="Upload gambar obat"),
    outputs=gr.Textbox(label="Teks yang terdeteksi", lines=10),
    title="💊 Obat Scanner - PaddleOCR",
    description="Upload foto kemasan obat untuk mengekstrak teks menggunakan PaddleOCR.",
    allow_flagging="never",
)

app = demo.app  # Access the underlying FastAPI app


@app.post("/ocr")
async def api_ocr(request: Request):
    """REST API endpoint compatible with the Node.js backend."""
    try:
        body = await request.json()
        image_base64 = body.get("imageBase64", "")

        # Remove data URI prefix if present
        if "," in image_base64:
            image_base64 = image_base64.split(",")[-1]

        image_data = base64.b64decode(image_base64)
        image = Image.open(io.BytesIO(image_data)).convert("RGB")
        img_np = np.array(image)

        raw_text, lines = run_ocr_on_image(img_np)

        return JSONResponse(content={
            "success": True,
            "rawText": raw_text,
            "lines": lines,
        })
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"success": False, "detail": str(e)},
        )


if __name__ == "__main__":
    demo.launch(server_name="0.0.0.0", server_port=7860)