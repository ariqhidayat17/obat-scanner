#!/bin/bash
# Start everything locally: backend + PaddleOCR + ngrok
# Usage: ./start-all-local.sh

set -e

BACKEND_PORT=3000
OCR_PORT=8001
VENV_DIR="ocr-service/.venv"

echo "=== Obat Scanner - Full Local Stack ==="
echo ""
echo "  Backend (Node.js) → port $BACKEND_PORT"
echo "  PaddleOCR (Python) → port $OCR_PORT"
echo "  ngrok → expose backend to internet"
echo ""

# Check ngrok
if ! command -v ngrok &> /dev/null; then
    echo "❌ ngrok belum terinstall. Jalankan: brew install ngrok"
    exit 1
fi

# Check node/pnpm
if ! command -v node &> /dev/null; then
    echo "❌ Node.js belum terinstall."
    exit 1
fi

# Setup Python venv
if [ ! -d "$VENV_DIR" ]; then
    echo "📦 Creating Python virtual environment..."
    python3 -m venv "$VENV_DIR"
fi
source "$VENV_DIR/bin/activate"

# Install Python deps if needed
if ! python -c "import paddleocr" &> /dev/null 2>&1; then
    echo "📦 Installing PaddleOCR dependencies (first time, may take a few minutes)..."
    pip install --upgrade pip
    pip install -r ocr-service/requirements.txt
fi

# Install Node.js deps if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing Node.js dependencies..."
    pnpm install
fi

# Create .env for local development (if not exists)
if [ ! -f .env ]; then
    echo ""
    echo "⚠️  File .env belum ada."
    echo "Buat file .env dengan isi minimal:"
    echo ""
    echo "  BUILT_IN_FORGE_API_KEY=YOUR_KEY_HERE"
    echo ""
    echo "Contoh:"
    echo "  cat > .env << 'ENVEOF'"
    echo "  NODE_ENV=production"
    echo "  EXPO_PUBLIC_API_BASE_URL=http://localhost:${BACKEND_PORT}"
    echo "  BUILT_IN_FORGE_API_KEY=YOUR_FORGE_API_KEY"
    echo "  PADDLE_OCR_URL=http://localhost:${OCR_PORT}"
    echo "  PORT=${BACKEND_PORT}"
    echo "  ENVEOF"
    echo ""
    exit 1
fi

echo ""
echo "🚀 Starting PaddleOCR on port $OCR_PORT..."
python ocr-service/main.py &
OCR_PID=$!

# Wait for PaddleOCR to be ready
echo "⏳ Waiting for PaddleOCR to start..."
for i in {1..60}; do
    if curl -s http://localhost:$OCR_PORT/health > /dev/null 2>&1; then
        echo "✅ PaddleOCR is ready!"
        break
    fi
    if [ $i -eq 60 ]; then
        echo "❌ Timeout waiting for PaddleOCR."
        kill $OCR_PID 2>/dev/null
        exit 1
    fi
    sleep 2
done

echo ""
echo "🚀 Starting backend on port $BACKEND_PORT..."
pnpm run dev &
BACKEND_PID=$!

# Wait for backend to be ready
echo "⏳ Waiting for backend to start..."
for i in {1..30}; do
    if curl -s http://localhost:$BACKEND_PORT > /dev/null 2>&1; then
        echo "✅ Backend is ready!"
        break
    fi
    sleep 2
done

echo ""
echo "🌐 Starting ngrok tunnel on backend..."
echo ""
echo "========================================="
echo "  COPY the ngrok URL below"
echo "  Set it as EXPO_PUBLIC_API_BASE_URL in .env"
echo "  Then rebuild APK with: eas build --platform android --profile preview"
echo "========================================="
echo ""
echo "  💡 For local testing, you can also use: http://localhost:$BACKEND_PORT"
echo ""

ngrok http $BACKEND_PORT

# Cleanup
kill $BACKEND_PID 2>/dev/null
kill $OCR_PID 2>/dev/null
echo "🛑 All services stopped."