#!/bin/bash

echo "🚀 Simple Backend Deployment"
echo "============================"

# Production server details
PROD_SERVER="34.14.197.81"
PROD_USER="samarajeewamehan"

echo "📡 Deploying backend to production server..."

# SSH to production server and deploy backend
ssh -o StrictHostKeyChecking=no ${PROD_USER}@${PROD_SERVER} << 'REMOTE_SCRIPT'
    echo "🔍 Current containers:"
    docker ps -a
    
    echo "🛑 Stopping existing backend..."
    docker stop task-manager-backend || true
    docker rm task-manager-backend || true
    
    echo "📥 Pulling backend image..."
    docker pull mehan02/task-manager-backend:latest
    
    echo "🚀 Starting backend container..."
    docker run -d \
        --name task-manager-backend \
        --restart unless-stopped \
        -p 8081:8081 \
        mehan02/task-manager-backend:latest
    
    echo "⏳ Waiting for backend to start..."
    sleep 15
    
    echo "🔍 Container status:"
    docker ps
    
    echo "🔍 Testing backend..."
    curl -f http://localhost:8081/actuator/health || echo "Health check failed"
    
    echo "✅ Backend deployed!"
    echo "API: http://34.14.197.81:8081"
    echo "Health: http://34.14.197.81:8081/actuator/health"
REMOTE_SCRIPT

echo "🎉 Deployment completed!"
