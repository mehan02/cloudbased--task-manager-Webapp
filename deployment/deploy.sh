#!/bin/bash

# Azure VM Deployment Script
# This script sets up the application on the Azure VM

set -e

echo "🚀 Starting Task Manager deployment on Azure VM..."

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    print_error "Please don't run this script as root"
    exit 1
fi

# Navigate to app directory
cd /app || { print_error "App directory not found"; exit 1; }

print_step "Checking Docker installation"
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed"
    exit 1
fi

print_success "Docker and Docker Compose are installed"

print_step "Checking environment variables"
if [ ! -f .env ]; then
    print_error ".env file not found"
    exit 1
fi

# Source environment variables
source .env

# Validate required environment variables
required_vars=(
    "ACR_LOGIN_SERVER"
    "SQL_CONNECTION_STRING"
    "SQL_ADMIN_USER"
    "SQL_ADMIN_PASSWORD"
    "JWT_SECRET"
    "VM_PUBLIC_IP"
)

for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        print_error "Environment variable $var is not set"
        exit 1
    fi
done

print_success "All required environment variables are set"

print_step "Checking Azure Container Registry connection"
if ! docker login "$ACR_LOGIN_SERVER" -u "$ACR_USERNAME" -p "$ACR_PASSWORD" > /dev/null 2>&1; then
    print_error "Failed to login to Azure Container Registry"
    exit 1
fi

print_success "Successfully connected to Azure Container Registry"

print_step "Pulling latest Docker images"
if ! docker-compose -f docker-compose.azure.yml pull; then
    print_error "Failed to pull Docker images"
    exit 1
fi

print_success "Docker images pulled successfully"

print_step "Stopping existing containers"
docker-compose -f docker-compose.azure.yml down --remove-orphans

print_step "Starting new containers"
if ! docker-compose -f docker-compose.azure.yml up -d; then
    print_error "Failed to start containers"
    exit 1
fi

print_success "Containers started successfully"

print_step "Waiting for services to be ready"
sleep 30

# Health check function
check_service() {
    local service_name=$1
    local url=$2
    local max_attempts=30
    local attempt=1

    echo "Checking $service_name..."
    while [ $attempt -le $max_attempts ]; do
        if curl -f -s "$url" > /dev/null 2>&1; then
            print_success "$service_name is healthy"
            return 0
        fi
        echo "Attempt $attempt/$max_attempts failed, retrying in 5 seconds..."
        sleep 5
        ((attempt++))
    done
    
    print_error "$service_name health check failed after $max_attempts attempts"
    return 1
}

print_step "Performing health checks"

# Check backend
if ! check_service "Backend API" "http://localhost:8081/api/actuator/health"; then
    print_error "Backend health check failed"
    docker-compose -f docker-compose.azure.yml logs backend
    exit 1
fi

# Check frontend
if ! check_service "Frontend" "http://localhost:80/"; then
    print_error "Frontend health check failed"
    docker-compose -f docker-compose.azure.yml logs frontend
    exit 1
fi

print_step "Cleaning up old Docker images"
docker image prune -f > /dev/null 2>&1

print_step "Deployment Summary"
echo -e "${GREEN}"
echo "🎉 Deployment completed successfully!"
echo "=================================="
echo "🌐 Frontend URL: http://$VM_PUBLIC_IP"
echo "🔧 Backend API: http://$VM_PUBLIC_IP:8081/api"
echo "💊 Health Check: http://$VM_PUBLIC_IP:8081/api/actuator/health"
echo "📊 Metrics: http://$VM_PUBLIC_IP:8081/api/actuator/metrics"
echo -e "${NC}"

print_step "Container Status"
docker-compose -f docker-compose.azure.yml ps

print_step "System Resources"
echo "Disk usage:"
df -h /
echo
echo "Memory usage:"
free -h
echo
echo "Running containers:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

print_success "Task Manager is now running on Azure!"