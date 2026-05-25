#!/bin/bash

# Navigate to backend directory
cd "$(dirname "$0")"

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install dependencies
echo "Installing dependencies..."
pip install -r requirements.txt

# Get local IP
LOCAL_IP=$(ipconfig getifaddr en0 2>/dev/null || hostname -I 2>/dev/null | awk '{print $1}')
echo ""
echo "=========================================="
echo "  Monopoly Deal Server"
echo "=========================================="
echo ""
echo "  Server URL: http://${LOCAL_IP:-localhost}:8000"
echo "  WebSocket:  ws://${LOCAL_IP:-localhost}:8000/ws"
echo ""
echo "  Enter this IP in the app: ${LOCAL_IP:-localhost}"
echo ""
echo "=========================================="
echo ""

# Run the server
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
