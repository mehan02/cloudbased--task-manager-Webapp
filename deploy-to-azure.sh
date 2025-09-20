#!/bin/bash

# Azure VM Deployment Script
# This script deploys the Task Manager application to Azure VM

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Deploying Task Manager to Azure VM${NC}"
echo "========================================"

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${RED}❌ .env file not found! Please create it from .env.template${NC}"
    exit 1
fi

# Load environment variables
export $(cat .env | grep -v '^#' | xargs)

# Validate required environment variables
required_vars=("ACR_LOGIN_SERVER" "ACR_USERNAME" "ACR_PASSWORD" "VM_PUBLIC_IP" "SQL_CONNECTION_STRING" "SQL_ADMIN_USER" "SQL_ADMIN_PASSWORD" "JWT_SECRET")

for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo -e "${RED}❌ Environment variable $var is not set${NC}"
        exit 1
    fi
done

echo -e "${GREEN}✅ Environment variables validated${NC}"

# Function to run commands on VM
run_on_vm() {
    ssh -o StrictHostKeyChecking=no azureuser@$VM_PUBLIC_IP "$1"
}

# Function to copy files to VM
copy_to_vm() {
    scp -o StrictHostKeyChecking=no "$1" azureuser@$VM_PUBLIC_IP:"$2"
}

echo -e "${BLUE}📋 Connecting to Azure VM: $VM_PUBLIC_IP${NC}"

# Test VM connection
if ! ssh -o BatchMode=yes -o ConnectTimeout=5 -o StrictHostKeyChecking=no azureuser@$VM_PUBLIC_IP exit &>/dev/null; then
    echo -e "${RED}❌ Cannot connect to VM. Please check:${NC}"
    echo "  • VM is running"
    echo "  • SSH key is properly configured"
    echo "  • Security group allows SSH (port 22)"
    exit 1
fi

echo -e "${GREEN}✅ Connected to Azure VM${NC}"

# Login to Azure Container Registry on VM
echo -e "${BLUE}📦 Logging into Azure Container Registry${NC}"
run_on_vm "echo $ACR_PASSWORD | docker login $ACR_LOGIN_SERVER --username $ACR_USERNAME --password-stdin"

# Copy docker-compose file to VM
echo -e "${BLUE}📁 Copying deployment files to VM${NC}"
copy_to_vm "docker-compose.azure.yml" "/app/docker-compose.yml"
copy_to_vm ".env" "/app/.env"

# Stop existing containers
echo -e "${BLUE}🛑 Stopping existing containers${NC}"
run_on_vm "cd /app && docker-compose down --remove-orphans || true"

# Pull latest images
echo -e "${BLUE}⬇️ Pulling latest Docker images${NC}"
run_on_vm "cd /app && docker-compose pull"

# Start containers
echo -e "${BLUE}🚀 Starting application containers${NC}"
run_on_vm "cd /app && docker-compose up -d"

# Wait for services to be healthy
echo -e "${BLUE}⏳ Waiting for services to be ready${NC}"
sleep 30

# Check service health
echo -e "${BLUE}🏥 Checking service health${NC}"

# Check backend health
backend_health=$(run_on_vm "curl -s -o /dev/null -w '%{http_code}' http://localhost:8081/api/actuator/health || echo '000'")
if [ "$backend_health" = "200" ]; then
    echo -e "${GREEN}✅ Backend service is healthy${NC}"
else
    echo -e "${YELLOW}⚠️ Backend service health check returned: $backend_health${NC}"
fi

# Check frontend health
frontend_health=$(run_on_vm "curl -s -o /dev/null -w '%{http_code}' http://localhost:80/health || echo '000'")
if [ "$frontend_health" = "200" ]; then
    echo -e "${GREEN}✅ Frontend service is healthy${NC}"
else
    echo -e "${YELLOW}⚠️ Frontend service health check returned: $frontend_health${NC}"
fi

# Show container status
echo -e "${BLUE}📊 Container Status${NC}"
run_on_vm "cd /app && docker-compose ps"

# Show application logs
echo -e "${BLUE}📝 Recent Application Logs${NC}"
echo "Backend logs:"
run_on_vm "cd /app && docker-compose logs --tail=10 backend"
echo ""
echo "Frontend logs:"
run_on_vm "cd /app && docker-compose logs --tail=10 frontend"

# Final summary
echo -e "\n${GREEN}🎉 Deployment Complete!${NC}"
echo "================================"
echo -e "${BLUE}Application URLs:${NC}"
echo "  • Frontend: http://$VM_PUBLIC_IP"
echo "  • Backend API: http://$VM_PUBLIC_IP:8081/api"
echo "  • Health Check: http://$VM_PUBLIC_IP:8081/api/actuator/health"
echo ""
echo -e "${BLUE}SSH to VM:${NC}"
echo "  ssh azureuser@$VM_PUBLIC_IP"
echo ""
echo -e "${BLUE}View Logs:${NC}"
echo "  ssh azureuser@$VM_PUBLIC_IP 'cd /app && docker-compose logs -f'"
echo ""
echo -e "${BLUE}Manage Services:${NC}"
echo "  # Stop:    ssh azureuser@$VM_PUBLIC_IP 'cd /app && docker-compose down'"
echo "  # Start:   ssh azureuser@$VM_PUBLIC_IP 'cd /app && docker-compose up -d'"
echo "  # Restart: ssh azureuser@$VM_PUBLIC_IP 'cd /app && docker-compose restart'"

# Save deployment info
cat > deployment-info.txt << EOF
Task Manager Deployment Information
==================================

Deployment Date: $(date)
VM Public IP: $VM_PUBLIC_IP
Container Registry: $ACR_LOGIN_SERVER

Application URLs:
- Frontend: http://$VM_PUBLIC_IP
- Backend API: http://$VM_PUBLIC_IP:8081/api
- Health Check: http://$VM_PUBLIC_IP:8081/api/actuator/health

SSH Access:
ssh azureuser@$VM_PUBLIC_IP

Container Management:
cd /app && docker-compose [up -d|down|restart|logs -f]
EOF

echo -e "${BLUE}📄 Deployment info saved to: deployment-info.txt${NC}"