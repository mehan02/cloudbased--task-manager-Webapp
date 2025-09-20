# Azure Authentication Guide

This guide explains how to authenticate with Azure to run the infrastructure setup script.

## 🔐 Authentication Methods

### Method 1: Interactive Login (Recommended for Local Development)

This is the easiest method when running the script from your local machine:

```bash
# Step 1: Login to Azure
az login

# Step 2: Select your subscription (if you have multiple)
az account list --output table
az account set --subscription "Your-Subscription-Name-or-ID"

# Step 3: Verify your login
az account show
```

**What happens:**
- Opens your browser for Azure login
- You sign in with your Azure credentials
- CLI stores authentication tokens locally
- Valid for several hours/days depending on settings

### Method 2: Service Principal (For Automation/CI/CD)

For automated deployments or CI/CD pipelines:

```bash
# Step 1: Create a service principal
az ad sp create-for-rbac \
    --name "TaskManagerDeployment" \
    --role "Contributor" \
    --scopes "/subscriptions/YOUR_SUBSCRIPTION_ID"

# Step 2: Save the output (clientId, clientSecret, tenantId)
# Step 3: Login with service principal
az login --service-principal \
    --username CLIENT_ID \
    --password CLIENT_SECRET \
    --tenant TENANT_ID
```

### Method 3: Managed Identity (For Azure VMs)

If running from an Azure VM with managed identity enabled:

```bash
# Login using managed identity
az login --identity
```

## 🚀 Step-by-Step Setup Process

### Prerequisites
1. **Azure Subscription** - You need an active Azure subscription
2. **Permissions** - Contributor or Owner role on the subscription
3. **Azure CLI** - Installed and ready (✅ Already done)

### Step 1: Login to Azure
```bash
az login
```

This will:
- Open your default browser
- Redirect to Microsoft login page
- Ask for your Azure credentials
- Return to terminal with success message

### Step 2: Verify Your Account
```bash
# Check which subscriptions you have access to
az account list --output table

# Check current subscription
az account show --query "{name:name, id:id}" --output table
```

### Step 3: Set the Correct Subscription (if needed)
```bash
# If you have multiple subscriptions, set the one you want to use
az account set --subscription "Your-Subscription-Name"
```

### Step 4: Test Permissions
```bash
# Test if you can create resources
az group list --output table
```

### Step 5: Run the Infrastructure Setup
```bash
# Make the script executable
chmod +x setup-azure-infrastructure.sh

# Run the script
./setup-azure-infrastructure.sh
```

## 💡 Tips and Troubleshooting

### Common Issues:

1. **"Insufficient permissions"**
   - Make sure you have Contributor or Owner role
   - Contact your Azure admin to grant permissions

2. **"Subscription not found"**
   - Run `az account list` to see available subscriptions
   - Use `az account set --subscription "correct-name"`

3. **"Resource name conflicts"**
   - The script uses timestamps to avoid conflicts
   - If still occurs, run the script again (new timestamp)

4. **"Browser doesn't open"**
   - Use: `az login --use-device-code`
   - Follow the device code instructions

### Security Best Practices:

1. **Use Multi-Factor Authentication (MFA)**
   - Enable MFA on your Azure account

2. **Regular Token Refresh**
   - Login tokens expire, re-run `az login` if needed

3. **Least Privilege**
   - Only grant minimum required permissions

4. **Secure Storage**
   - Don't store credentials in scripts or code

## 🔍 Verification Commands

After authentication, verify everything is working:

```bash
# Check authentication status
az account show

# List available locations
az account list-locations --query "[].{Name:name, DisplayName:displayName}" --output table

# Test resource group creation (optional test)
az group create --name test-rg --location "East US" --dry-run
```

## 🎯 Next Steps

Once authenticated:
1. Run `./setup-azure-infrastructure.sh`
2. Script will create all Azure resources automatically
3. Save the output credentials for GitHub Actions
4. Continue with Step 4: GitHub Actions setup

## 🆘 Need Help?

If you encounter issues:
1. Check Azure CLI version: `az version`
2. Check login status: `az account show`
3. Verify permissions: `az role assignment list --assignee $(az account show --query user.name -o tsv)`