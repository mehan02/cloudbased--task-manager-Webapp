#!/bin/bash

echo "🔍 Debugging Backend Container"
echo "=============================="

# Production server details
PROD_SERVER="34.14.197.81"
PROD_USER="samarajeewamehan"

echo "📡 Connecting to production server..."

# Debug commands
ssh -o StrictHostKeyChecking=no ${PROD_USER}@${PROD_SERVER} << 'REMOTE_SCRIPT'
    echo "🔍 Checking container status..."
    docker ps -a
    
    echo "📋 Backend container logs (last 50 lines):"
    docker logs --tail 50 task-manager-backend
    
    echo "🔍 Checking if port 8081 is listening..."
    netstat -tlnp | grep 8081 || echo "Port 8081 not listening"
    
    echo "🔍 Testing backend with different endpoints..."
    echo "Testing actuator/health:"
    curl -v http://localhost:8081/actuator/health || echo "Health check failed"
    
    echo "Testing root endpoint:"
    curl -v http://localhost:8081/ || echo "Root endpoint failed"
    
    echo "🔍 Container resource usage:"
    docker stats --no-stream task-manager-backend
    
    echo "🔍 Container details:"
    docker inspect task-manager-backend | grep -A 10 -B 10 "State"
REMOTE_SCRIPT

echo "�� Debug completed!"
