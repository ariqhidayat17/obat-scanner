---
title: Obat Scanner OCR
emoji: 💊
colorFrom: blue
colorTo: green
sdk: docker
app_port: 7860
pinned: false
---

# Obat Scanner - PaddleOCR Service

FastAPI service yang menggunakan PaddleOCR untuk mengekstrak teks dari foto kemasan obat.

## API Endpoint

**POST** `/ocr`

```json
{
  "imageBase64": "base64_encoded_image_string"
}
```

Response:
```json
{
  "success": true,
  "rawText": "extracted text here",
  "lines": ["line 1", "line 2"]
}