#!/bin/bash

echo "🔧 Fixing Backend - Quick Solution"
echo "=================================="

# Production server details
PROD_SERVER="34.14.197.81"
PROD_USER="samarajeewamehan"

echo "📡 Connecting to production server..."

# Simple commands to fix the backend
ssh -o StrictHostKeyChecking=no ${PROD_USER}@${PROD_SERVER} << 'REMOTE_SCRIPT'
    echo "🔍 Checking current containers..."
    docker ps -a
    
    echo "🛑 Stopping any existing backend..."
    docker stop task-manager-backend || true
    docker rm task-manager-backend || true
    
    echo "📥 Pulling backend image from Docker Hub..."
    docker pull mehan02/task-manager-backend:latest
    
    echo "🚀 Starting backend container..."
    docker run -d \
        --name task-manager-backend \
        --restart unless-stopped \
        -p 8081:8081 \
        mehan02/task-manager-backend:latest
    
    echo "⏳ Waiting for backend to start..."
    sleep 20
    
    echo "🔍 Checking if backend is running..."
    docker ps | grep task-manager-backend
    
    echo "🔍 Testing backend health..."
    curl -f http://localhost:8081/actuator/health || echo "Health check failed"
    
    echo "✅ Backend should now be working!"
    echo "API: http://34.14.197.81:8081"
    echo "Health: http://34.14.197.81:8081/actuator/health"
REMOTE_SCRIPT

echo "🎉 Backend fix completed!"
echo "Test the frontend now: http://34.14.197.81/"
