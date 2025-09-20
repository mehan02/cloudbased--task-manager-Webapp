#!/bin/bash

# Azure Infrastructure Setup Script
# This script sets up everything needed for your task manager application on Azure

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Azure Infrastructure Setup for Task Manager${NC}"
echo "=================================================="

# Configuration Variables
RESOURCE_GROUP="rg-taskmanager-prod"
LOCATION="West US 2"
ACR_NAME="taskmanageracr001"
SQL_SERVER_NAME="taskmanager-sql-001"
SQL_DATABASE_NAME="taskmanagerdb"
SQL_ADMIN_USER="sqladmin"
VM_NAME="taskmanager-vm"
VM_SIZE="Standard_B2s"  # 2 vCPUs, 4GB RAM
KEYVAULT_NAME="taskkv001"

# Function to print section headers
print_section() {
    echo -e "\n${BLUE}📋 $1${NC}"
    echo "----------------------------------------"
}

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    echo -e "${RED}❌ Azure CLI is not installed. Please install it first.${NC}"
    echo "Visit: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
    exit 1
fi

# Login to Azure
print_section "Azure Authentication"
echo "Please ensure you're logged into Azure CLI..."
if ! az account show >/dev/null 2>&1; then
    echo "Please login to Azure..."
    az login
fi

SUBSCRIPTION_ID=$(az account show --query id -o tsv)
echo -e "${GREEN}✅ Logged into Azure (Subscription: $SUBSCRIPTION_ID)${NC}"

# Create Resource Group
print_section "Creating Resource Group"
if az group show --name $RESOURCE_GROUP &> /dev/null; then
    echo "Resource group $RESOURCE_GROUP already exists, skipping creation"
    print_success "Resource group exists"
else
    echo "Creating resource group: $RESOURCE_GROUP in $LOCATION"
    az group create \
        --name $RESOURCE_GROUP \
        --location "$LOCATION" \
        --output table
    echo -e "${GREEN}✅ Resource group created${NC}"
fi

# Create Azure Container Registry
print_section "Creating Azure Container Registry"
echo "Creating Azure Container Registry: $ACR_NAME"
az acr create \
    --name $ACR_NAME \
    --resource-group $RESOURCE_GROUP \
    --sku Basic \
    --admin-enabled true \
    --output table

ACR_LOGIN_SERVER=$(az acr show --name $ACR_NAME --resource-group $RESOURCE_GROUP --query loginServer -o tsv)
ACR_USERNAME=$(az acr credential show --name $ACR_NAME --resource-group $RESOURCE_GROUP --query username -o tsv)
ACR_PASSWORD=$(az acr credential show --name $ACR_NAME --resource-group $RESOURCE_GROUP --query passwords[0].value -o tsv)

echo -e "${GREEN}✅ Azure Container Registry created${NC}"
echo -e "${YELLOW}📝 ACR Login Server: $ACR_LOGIN_SERVER${NC}"
echo -e "${YELLOW}📝 ACR Username: $ACR_USERNAME${NC}"

# Create Azure SQL Database
print_section "Creating Azure SQL Database"
echo "Enter a secure password for SQL Server admin:"
read -s SQL_ADMIN_PASSWORD
echo

echo "Creating SQL Server: $SQL_SERVER_NAME"
az sql server create \
    --name $SQL_SERVER_NAME \
    --resource-group $RESOURCE_GROUP \
    --location "$LOCATION" \
    --admin-user $SQL_ADMIN_USER \
    --admin-password "$SQL_ADMIN_PASSWORD" \
    --output table

echo "Creating SQL Database: $SQL_DATABASE_NAME"
az sql db create \
    --name $SQL_DATABASE_NAME \
    --server $SQL_SERVER_NAME \
    --resource-group $RESOURCE_GROUP \
    --service-objective Basic \
    --max-size 2GB \
    --output table

echo "Configuring SQL Server firewall..."
# Allow Azure services
az sql server firewall-rule create \
    --name AllowAzureServices \
    --server $SQL_SERVER_NAME \
    --resource-group $RESOURCE_GROUP \
    --start-ip-address 0.0.0.0 \
    --end-ip-address 0.0.0.0 \
    --output table

# Allow local IP for testing
LOCAL_IP=$(curl -s https://api.ipify.org)
az sql server firewall-rule create \
    --name AllowLocalIP \
    --server $SQL_SERVER_NAME \
    --resource-group $RESOURCE_GROUP \
    --start-ip-address $LOCAL_IP \
    --end-ip-address $LOCAL_IP \
    --output table

SQL_CONNECTION_STRING="jdbc:sqlserver://${SQL_SERVER_NAME}.database.windows.net:1433;database=${SQL_DATABASE_NAME};encrypt=true;trustServerCertificate=false;hostNameInCertificate=*.database.windows.net;loginTimeout=30;"

echo -e "${GREEN}✅ Azure SQL Database created${NC}"

# Create Key Vault
print_section "Creating Azure Key Vault"
echo "Creating Key Vault: $KEYVAULT_NAME"
az keyvault create \
    --name $KEYVAULT_NAME \
    --resource-group $RESOURCE_GROUP \
    --location "$LOCATION" \
    --output table

echo -e "${GREEN}✅ Azure Key Vault created${NC}"

# Create Virtual Network
print_section "Creating Virtual Network"
VNET_NAME="taskmanager-vnet"
SUBNET_NAME="taskmanager-subnet"

echo "Creating virtual network..."
az network vnet create \
    --resource-group $RESOURCE_GROUP \
    --name $VNET_NAME \
    --address-prefix 10.0.0.0/16 \
    --subnet-name $SUBNET_NAME \
    --subnet-prefix 10.0.1.0/24 \
    --output table

echo -e "${GREEN}✅ Virtual Network created${NC}"

# Create Network Security Group
print_section "Creating Network Security Group"
NSG_NAME="taskmanager-nsg"

echo "Creating network security group..."
az network nsg create \
    --resource-group $RESOURCE_GROUP \
    --name $NSG_NAME \
    --output table

# Add security rules
echo "Adding security rules..."
az network nsg rule create \
    --resource-group $RESOURCE_GROUP \
    --nsg-name $NSG_NAME \
    --name AllowSSH \
    --protocol tcp \
    --priority 1000 \
    --destination-port-range 22 \
    --access allow \
    --output table

az network nsg rule create \
    --resource-group $RESOURCE_GROUP \
    --nsg-name $NSG_NAME \
    --name AllowHTTP \
    --protocol tcp \
    --priority 1001 \
    --destination-port-range 80 \
    --access allow \
    --output table

az network nsg rule create \
    --resource-group $RESOURCE_GROUP \
    --nsg-name $NSG_NAME \
    --name AllowHTTPS \
    --protocol tcp \
    --priority 1002 \
    --destination-port-range 443 \
    --access allow \
    --output table

az network nsg rule create \
    --resource-group $RESOURCE_GROUP \
    --nsg-name $NSG_NAME \
    --name AllowBackend \
    --protocol tcp \
    --priority 1003 \
    --destination-port-range 8081 \
    --access allow \
    --output table

echo -e "${GREEN}✅ Network Security Group created${NC}"

# Create Public IP
print_section "Creating Public IP"
PUBLIC_IP_NAME="taskmanager-pip"

echo "Creating public IP..."
az network public-ip create \
    --resource-group $RESOURCE_GROUP \
    --name $PUBLIC_IP_NAME \
    --allocation-method Static \
    --sku Standard \
    --output table

VM_PUBLIC_IP=$(az network public-ip show --resource-group $RESOURCE_GROUP --name $PUBLIC_IP_NAME --query ipAddress -o tsv)
echo -e "${GREEN}✅ Public IP created: $VM_PUBLIC_IP${NC}"

# Create Virtual Machine
print_section "Creating Virtual Machine"
echo "Creating Ubuntu VM for Docker deployment..."

# Generate SSH key if it doesn't exist
if [ ! -f ~/.ssh/id_rsa ]; then
    echo "Generating SSH key..."
    ssh-keygen -t rsa -b 4096 -f ~/.ssh/id_rsa -N ""
fi

az vm create \
    --resource-group $RESOURCE_GROUP \
    --name $VM_NAME \
    --image Ubuntu2204 \
    --size $VM_SIZE \
    --admin-username azureuser \
    --ssh-key-values ~/.ssh/id_rsa.pub \
    --vnet-name $VNET_NAME \
    --subnet $SUBNET_NAME \
    --nsg $NSG_NAME \
    --public-ip-address $PUBLIC_IP_NAME \
    --output table

echo -e "${GREEN}✅ Virtual Machine created${NC}"

# Install Docker on VM
print_section "Installing Docker on VM"
echo "Installing Docker and Docker Compose on the VM..."

# Create setup script
cat > setup-vm.sh << 'EOF'
#!/bin/bash
set -e

# Update system
sudo apt-get update
sudo apt-get upgrade -y

# Install Docker
sudo apt-get install -y apt-transport-https ca-certificates curl gnupg lsb-release
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Add user to docker group
sudo usermod -aG docker azureuser

# Install Azure CLI
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash

# Create app directory
sudo mkdir -p /app
sudo chown azureuser:azureuser /app

echo "Setup complete!"
EOF

# Copy and run setup script on VM
scp -o StrictHostKeyChecking=no setup-vm.sh azureuser@$VM_PUBLIC_IP:/tmp/
ssh -o StrictHostKeyChecking=no azureuser@$VM_PUBLIC_IP 'chmod +x /tmp/setup-vm.sh && /tmp/setup-vm.sh'

echo -e "${GREEN}✅ Docker installed on VM${NC}"

# Create Service Principal for GitHub Actions
print_section "Creating Service Principal for GitHub Actions"
SP_NAME="sp-taskmanager-github-actions"

echo "Creating service principal for GitHub Actions..."
SP_OUTPUT=$(az ad sp create-for-rbac \
    --name $SP_NAME \
    --role "Contributor" \
    --scopes "/subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP" \
    --sdk-auth)

echo -e "${GREEN}✅ Service Principal created${NC}"

# Store secrets in Key Vault
print_section "Storing Secrets in Key Vault"
echo "Storing secrets in Azure Key Vault..."

az keyvault secret set \
    --vault-name $KEYVAULT_NAME \
    --name "sql-admin-password" \
    --value "$SQL_ADMIN_PASSWORD" \
    --output table

az keyvault secret set \
    --vault-name $KEYVAULT_NAME \
    --name "acr-password" \
    --value "$ACR_PASSWORD" \
    --output table

JWT_SECRET=$(openssl rand -base64 32)
az keyvault secret set \
    --vault-name $KEYVAULT_NAME \
    --name "jwt-secret" \
    --value "$JWT_SECRET" \
    --output table

echo -e "${GREEN}✅ Secrets stored in Key Vault${NC}"

# Summary
print_section "🎉 Setup Complete! Summary"
echo -e "${GREEN}All Azure resources have been created successfully!${NC}"
echo ""
echo "📋 Resource Information:"
echo "  • Resource Group: $RESOURCE_GROUP"
echo "  • Location: $LOCATION"
echo "  • Container Registry: $ACR_LOGIN_SERVER"
echo "  • SQL Server: ${SQL_SERVER_NAME}.database.windows.net"
echo "  • SQL Database: $SQL_DATABASE_NAME"
echo "  • Key Vault: $KEYVAULT_NAME"
echo "  • VM Public IP: $VM_PUBLIC_IP"
echo "  • VM Username: azureuser"
echo ""
echo "🔐 GitHub Secrets to Add:"
echo "  Add these secrets to your GitHub repository:"
echo ""
echo "AZURE_CREDENTIALS:"
echo "$SP_OUTPUT"
echo ""
echo "ACR_LOGIN_SERVER: $ACR_LOGIN_SERVER"
echo "ACR_USERNAME: $ACR_USERNAME"
echo "ACR_PASSWORD: $ACR_PASSWORD"
echo "SQL_CONNECTION_STRING: $SQL_CONNECTION_STRING"
echo "SQL_ADMIN_USER: $SQL_ADMIN_USER"
echo "SQL_ADMIN_PASSWORD: $SQL_ADMIN_PASSWORD"
echo "JWT_SECRET: $JWT_SECRET"
echo "VM_PUBLIC_IP: $VM_PUBLIC_IP"
echo ""
echo "🔗 VM Connection:"
echo "  SSH to VM: ssh azureuser@$VM_PUBLIC_IP"
echo ""
echo "🚀 Next Steps:"
echo "  1. Add the GitHub secrets listed above"
echo "  2. Configure your application for Azure SQL"
echo "  3. Set up GitHub Actions workflow"
echo "  4. Deploy your application!"

# Save important info to file
cat > azure-setup-info.txt << EOF
Azure Setup Information
======================

Resource Group: $RESOURCE_GROUP
Location: $LOCATION
Container Registry: $ACR_LOGIN_SERVER
SQL Server: ${SQL_SERVER_NAME}.database.windows.net
SQL Database: $SQL_DATABASE_NAME
Key Vault: $KEYVAULT_NAME
VM Public IP: $VM_PUBLIC_IP
VM Username: azureuser

ACR Username: $ACR_USERNAME
ACR Password: $ACR_PASSWORD
SQL Connection String: $SQL_CONNECTION_STRING
SQL Admin User: $SQL_ADMIN_USER
SQL Admin Password: $SQL_ADMIN_PASSWORD
JWT Secret: $JWT_SECRET

Service Principal JSON:
$SP_OUTPUT
EOF

echo -e "${BLUE}📄 Setup information saved to: azure-setup-info.txt${NC}"