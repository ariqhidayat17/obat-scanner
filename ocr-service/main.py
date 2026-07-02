import base64
import io
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from PIL import Image
from paddleocr import PaddleOCR

app = FastAPI(title="PaddleOCR Sidecar Service")

# Initialize PaddleOCR (downloads models on first run)
# Using English/Latin model by default which is highly optimized for medical terms and general text
ocr = PaddleOCR(use_textline_orientation=True, lang="en")

class OCRRequest(BaseModel):
    imageBase64: str

@app.post("/ocr")
async def perform_ocr(request: OCRRequest):
    try:
        # Decode base64 image
        image_data = base64.b64decode(request.imageBase64.split(",")[-1])
        image = Image.open(io.BytesIO(image_data)).convert("RGB")
        
        # Save temp image for PaddleOCR (needs file path or numpy array)
        # We can pass numpy array directly by converting PIL image
        import numpy as np
        img_np = np.array(image)
        
        # Run OCR
        result = ocr.ocr(img_np, cls=True)
        
        # Extract text
        extracted_texts = []
        if result and result[0]:
            for line in result[0]:
                text = line[1][0]
                confidence = line[1][1]
                if confidence > 0.5:  # filter low confidence text
                    extracted_texts.append(text)
                    
        raw_text = "\n".join(extracted_texts)
        return {
            "success": True,
            "rawText": raw_text,
            "lines": extracted_texts
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
