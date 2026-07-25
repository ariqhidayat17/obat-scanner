import base64
import io
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from PIL import Image
from paddleocr import PaddleOCR

app = FastAPI(title="PaddleOCR Sidecar Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health():
    return {"ok": True}

import logging
logging.getLogger("ppocr").setLevel(logging.ERROR)

# Initialize PaddleOCR (downloads models on first run)
# Using English/Latin model by default which is highly optimized for medical terms and general text
ocr = PaddleOCR(use_textline_orientation=True, lang="en")

class OCRRequest(BaseModel):
    imageBase64: str

@app.post("/ocr")
async def perform_ocr(request: OCRRequest):
    print("Received OCR request")
    try:
        # Decode base64 image
        image_data = base64.b64decode(request.imageBase64.split(",")[-1])
        image = Image.open(io.BytesIO(image_data)).convert("L") # Konversi ke Grayscale
        
        print(f"Image received: {image.size}")
        
        import numpy as np
        img_np = np.array(image)
        
        # Run OCR
        result = ocr.ocr(img_np, cls=False) # Matikan classifier untuk testing
        print(f"OCR result: {result}")
        
        # Extract text
        extracted_texts = []
        if result and result[0]:
            for line in result[0]:
                text = line[1][0]
                confidence = line[1][1]
                # Lower threshold to 0.3 to catch more label text
                if confidence > 0.3:
                    extracted_texts.append(text)
        
        # Fallback: jika tidak ada teks, kembalikan semua hasil mentah untuk debug
        if not extracted_texts and result and result[0]:
            extracted_texts = [line[1][0] for line in result[0]]
                    
        raw_text = "\n".join(extracted_texts)
        return {
            "success": True,
            "rawText": raw_text,
            "lines": extracted_texts
        }
    except Exception as e:
        # Return clean error JSON instead of HTML
        import traceback
        return {
            "success": False,
            "error": str(e),
            "traceback": traceback.format_exc()
        }

if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.environ.get("PORT", 8001))
    uvicorn.run(app, host="0.0.0.0", port=port)
