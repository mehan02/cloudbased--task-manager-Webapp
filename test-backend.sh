#!/bin/bash

echo "Building backend..."
cd /Users/mehan/tk/cloudbased--task-manager-Webapp/backend
./gradlew bootJar

echo "Starting backend..."
java -jar build/libs/cloud-based-Task-manager-0.0.1-SNAPSHOT.jar --spring.profiles.active=local --server.servlet.context-path="" &
BACKEND_PID=$!

echo "Backend started with PID: $BACKEND_PID"

# Wait for startup
echo "Waiting for backend to start..."
sleep 15

echo "Testing health endpoint..."
curl -f http://localhost:8081/actuator/health

echo -e "\n\nTesting signup endpoint..."
curl -v -X POST \
  http://localhost:8081/api/auth/signup \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:3000" \
  -d '{
    "username": "testuser",
    "email": "test@example.com", 
    "password": "password123"
  }'

echo -e "\n\nKilling backend process..."
kill $BACKEND_PID

echo "Test completed!"