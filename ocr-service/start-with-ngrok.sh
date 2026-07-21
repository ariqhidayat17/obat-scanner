#!/bin/bash
# Start PaddleOCR service locally + expose via ngrok
# Usage: cd ocr-service && ./start-with-ngrok.sh

set -e

PORT=8001
VENV_DIR=".venv"

echo "=== Obat Scanner - PaddleOCR + ngrok ==="
echo ""

# Check if ngrok is installed
if ! command -v ngrok &> /dev/null; then
    echo "❌ ngrok belum terinstall."
    echo "   Install: brew install ngrok"
    echo "   Atau download dari https://ngrok.com/download"
    exit 1
fi

# Create virtual environment if it doesn't exist
if [ ! -d "$VENV_DIR" ]; then
    echo "📦 Creating Python virtual environment..."
    python3 -m venv "$VENV_DIR"
fi

# Activate virtual environment
source "$VENV_DIR/bin/activate"

# Install dependencies if needed
if ! python -c "import paddleocr" &> /dev/null 2>&1; then
    echo "📦 Installing Python dependencies (first time, may take a few minutes)..."
    pip install --upgrade pip
    pip install -r requirements.txt
fi

echo "🚀 Starting PaddleOCR service on port $PORT..."
python main.py &
OCR_PID=$!

# Wait for service to be ready
echo "⏳ Waiting for service to start (downloading models on first run)..."
for i in {1..60}; do
    if curl -s http://localhost:$PORT/health > /dev/null 2>&1; then
        echo "✅ PaddleOCR service is ready!"
        break
    fi
    if [ $i -eq 60 ]; then
        echo "❌ Timeout waiting for service. Check logs above."
        kill $OCR_PID 2>/dev/null
        exit 1
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