#!/bin/bash

# Rollback Script for Azure VM Deployment
# This script helps rollback to a previous working version

set -e

echo "🔄 Starting Task Manager rollback process..."

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_step() {
    echo -e "\n${BLUE}📋 $1${NC}"
    echo "----------------------------------------"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Navigate to app directory
cd /app || { print_error "App directory not found"; exit 1; }

print_step "Checking available Docker images"
echo "Available backend images:"
docker images --filter "reference=*/taskmanager-backend" --format "table {{.Repository}}\t{{.Tag}}\t{{.CreatedAt}}"
echo
echo "Available frontend images:"
docker images --filter "reference=*/taskmanager-frontend" --format "table {{.Repository}}\t{{.Tag}}\t{{.CreatedAt}}"

print_step "Current running containers"
docker-compose -f docker-compose.azure.yml ps

# Ask user for rollback target
echo
read -p "Enter the image tag to rollback to (e.g., main-abc1234): " ROLLBACK_TAG

if [ -z "$ROLLBACK_TAG" ]; then
    print_error "No tag specified"
    exit 1
fi

# Validate tag exists
if ! docker images --filter "reference=*/taskmanager-backend:$ROLLBACK_TAG" --format "{{.Tag}}" | grep -q "$ROLLBACK_TAG"; then
    print_error "Backend image with tag '$ROLLBACK_TAG' not found"
    exit 1
fi

if ! docker images --filter "reference=*/taskmanager-frontend:$ROLLBACK_TAG" --format "{{.Tag}}" | grep -q "$ROLLBACK_TAG"; then
    print_error "Frontend image with tag '$ROLLBACK_TAG' not found"
    exit 1
fi

print_warning "This will rollback both backend and frontend to tag: $ROLLBACK_TAG"
read -p "Are you sure? (y/N): " -r
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Rollback cancelled"
    exit 0
fi

print_step "Creating backup of current docker-compose file"
cp docker-compose.azure.yml docker-compose.azure.yml.backup.$(date +%Y%m%d_%H%M%S)

print_step "Updating docker-compose file with rollback images"
# Update the docker-compose file to use specific tags
sed -i.bak "s|image: \${ACR_LOGIN_SERVER}/taskmanager-backend:latest|image: \${ACR_LOGIN_SERVER}/taskmanager-backend:$ROLLBACK_TAG|g" docker-compose.azure.yml
sed -i.bak "s|image: \${ACR_LOGIN_SERVER}/taskmanager-frontend:latest|image: \${ACR_LOGIN_SERVER}/taskmanager-frontend:$ROLLBACK_TAG|g" docker-compose.azure.yml

print_step "Stopping current containers"
docker-compose -f docker-compose.azure.yml down

print_step "Starting containers with rollback images"
if ! docker-compose -f docker-compose.azure.yml up -d; then
    print_error "Rollback failed to start containers"
    # Restore original docker-compose file
    mv docker-compose.azure.yml.bak docker-compose.azure.yml
    exit 1
fi

print_step "Waiting for services to start"
sleep 30

# Health check
print_step "Performing health checks"
if curl -f -s "http://localhost:8081/api/actuator/health" > /dev/null; then
    print_success "Backend health check passed"
else
    print_error "Backend health check failed"
    docker-compose -f docker-compose.azure.yml logs backend
fi

if curl -f -s "http://localhost:80/" > /dev/null; then
    print_success "Frontend health check passed"
else
    print_error "Frontend health check failed"
    docker-compose -f docker-compose.azure.yml logs frontend
fi

print_step "Rollback Summary"
echo -e "${GREEN}"
echo "🔄 Rollback completed!"
echo "===================="
echo "📦 Backend image: taskmanager-backend:$ROLLBACK_TAG"
echo "📦 Frontend image: taskmanager-frontend:$ROLLBACK_TAG"
echo "🌐 Application URL: http://$(cat .env | grep VM_PUBLIC_IP | cut -d'=' -f2)"
echo -e "${NC}"

print_step "Container Status"
docker-compose -f docker-compose.azure.yml ps

# Clean up backup file
rm -f docker-compose.azure.yml.bak

print_success "Rollback process completed successfully!"