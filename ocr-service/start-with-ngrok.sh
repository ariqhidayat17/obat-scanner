#!/bin/bash
# Start PaddleOCR service locally + expose via ngrok
# Usage: cd ocr-service && ./start-with-ngrok.sh

set -e

PORT=8001

echo "=== Obat Scanner - PaddleOCR + ngrok ==="
echo ""

# Check if ngrok is installed
if ! command -v ngrok &> /dev/null; then
    echo "❌ ngrok belum terinstall."
    echo "   Install: brew install ngrok"
    echo "   Atau download dari https://ngrok.com/download"
    exit 1
fi

# Check if Python dependencies are installed
if ! python3 -c "import paddleocr" &> /dev/null; then
    echo "📦 Installing Python dependencies..."
    pip3 install -r requirements.txt
fi

echo "🚀 Starting PaddleOCR service on port $PORT..."
python3 main.py &
OCR_PID=$!

# Wait for service to be ready
echo "⏳ Waiting for service to start..."
for i in {1..30}; do
    if curl -s http://localhost:$PORT/health > /dev/null 2>&1; then
        echo "✅ PaddleOCR service is ready!"
        break
    fi
    sleep 2
done

echo ""
echo "🌐 Starting ngrok tunnel..."
echo ""
echo "========================================="
echo "  COPY the ngrok URL (https://xxxx.ngrok-free.app)"
echo "  and set it as PADDLE_OCR_URL in Render"
echo "========================================="
echo ""

ngrok http $PORT

# Cleanup when ngrok is stopped
kill $OCR_PID 2>/dev/null
echo "🛑 PaddleOCR service stopped."