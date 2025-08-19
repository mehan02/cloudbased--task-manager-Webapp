#!/bin/bash

echo "Testing Docker Hub credentials..."

# Test if credentials are accessible
if [ -z "$DOCKER_USERNAME" ] || [ -z "$DOCKER_PASSWORD" ]; then
    echo "❌ Docker credentials not found in environment variables"
    echo "DOCKER_USERNAME: $DOCKER_USERNAME"
    echo "DOCKER_PASSWORD: ${DOCKER_PASSWORD:0:5}..."
    exit 1
fi

echo "✅ Docker credentials found"
echo "Username: $DOCKER_USERNAME"
echo "Password: ${DOCKER_PASSWORD:0:5}..."

# Test Docker login
echo "Testing Docker login..."
echo "$DOCKER_PASSWORD" | docker login -u "$DOCKER_USERNAME" --password-stdin

if [ $? -eq 0 ]; then
    echo "✅ Docker login successful"
else
    echo "❌ Docker login failed"
    exit 1
fi

echo "✅ All tests passed"
