---
title: Obat Scanner OCR
emoji: 💊
colorFrom: blue
colorTo: green
sdk: gradio
sdk_version: 4.44.1
app_file: app.py
pinned: false
---

# Obat Scanner - PaddleOCR Service

Gradio app yang menggunakan PaddleOCR untuk mengekstrak teks dari foto kemasan obat.

## Cara Deploy ke HuggingFace Spaces

Upload file-file berikut ke Space baru:
1. `app.py` — main application
2. `requirements-hf.txt` → **rename jadi `requirements.txt`** saat upload
3. File ini → **rename jadi `README.md`** saat upload

## REST API Endpoint

Selain UI Gradio, service ini juga menyediakan REST API:

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