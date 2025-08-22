#!/bin/bash

echo "🚀 Quick Backend Deployment Script"
echo "=================================="

# Production server details
PROD_SERVER="34.14.197.81"
PROD_USER="samarajeewamehan"
BACKEND_PORT="8081"
CONTAINER_NAME="task-manager-backend"

echo "📡 Connecting to production server..."

# SSH to production server and deploy backend
ssh -o StrictHostKeyChecking=no ${PROD_USER}@${PROD_SERVER} << 'REMOTE_SCRIPT'
    echo "🔍 Checking current containers..."
    docker ps -a
    
    echo "🛑 Stopping existing backend container..."
    docker stop task-manager-backend || true
    docker rm task-manager-backend || true
    
    echo "📥 Pulling latest backend image..."
    docker pull mehan02/task-manager-backend:latest
    
    echo "🚀 Starting new backend container..."
    docker run -d \
        --name task-manager-backend \
        --restart unless-stopped \
        -p 8081:8081 \
        -e SPRING_DATASOURCE_URL='jdbc:postgresql://34.14.211.97:5432/taskmanager' \
        -e SPRING_DATASOURCE_USERNAME='taskuser' \
        -e SPRING_DATASOURCE_PASSWORD='your-db-password-here' \
        -e SPRING_PROFILES_ACTIVE=prod \
        mehan02/task-manager-backend:latest
    
    echo "⏳ Waiting for backend to start..."
    sleep 10
    
    echo "🔍 Checking container status..."
    docker ps
    
    echo "🔍 Testing backend health..."
    curl -f http://localhost:8081/actuator/health || echo "Backend health check failed"
    
    echo "✅ Backend deployment completed!"
    echo "Backend API: http://34.14.197.81:8081"
    echo "Health Check: http://34.14.197.81:8081/actuator/health"
REMOTE_SCRIPT

echo "🎉 Deployment script completed!"
echo "Check the backend at: http://34.14.197.81:8081/actuator/health"
