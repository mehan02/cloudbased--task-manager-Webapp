# Jenkins Credentials Verification Guide

## Issue Analysis
The Docker Hub login is failing because the Jenkins credential `docker-hub-pass` is not properly configured.

## Current Error
```
+ echo ****
+ docker login -u Docker Hub --password-stdin
Error response from daemon: Get "https://Hub/v2/": dial tcp: lookup Hub on 127.0.0.53:53: server misbehaving
```

## Problem
The username is showing as "Docker Hub" instead of the actual Docker Hub username, indicating the credential is not properly configured.

## Solution Steps

### 1. Check Current Jenkins Credentials
Go to your Jenkins dashboard:
- **Manage Jenkins** → **Manage Credentials** → **System** → **Global credentials**
- Look for the credential with ID: `docker-hub-pass`
- Check if it's properly configured

### 2. Recreate the Docker Hub Credential
If the credential is not working, recreate it:

1. **Delete the existing credential** (if it exists)
2. **Add new credential**:
   - **Kind**: Username with password
   - **Scope**: Global
   - **ID**: `docker-hub-pass`
   - **Description**: Docker Hub credentials for pushing images
   - **Username**: Your actual Docker Hub username (e.g., `mehan02`)
   - **Password**: Your Docker Hub password or access token

### 3. Verify Credential Configuration
The credential should have:
- **ID**: `docker-hub-pass`
- **Username**: Your Docker Hub username (not "Docker Hub")
- **Password**: Your Docker Hub password/token

### 4. Test the Pipeline
After fixing the credentials:
1. Trigger a new pipeline run
2. Check the logs for the debug output:
   ```
   Debug: DOCKER_USERNAME length: X
   Debug: DOCKER_PASSWORD length: Y
   ```

### 5. Expected Output
If credentials are correct, you should see:
```
Debug: DOCKER_USERNAME length: 7
Debug: DOCKER_PASSWORD length: 20
🔐 Attempting Docker Hub login...
Login Succeeded
✅ Docker login successful
```

## Alternative: Use Docker Hub Access Token
For better security, use a Docker Hub access token instead of password:

1. Go to Docker Hub → Account Settings → Security
2. Create a new access token
3. Use the token as the password in Jenkins credentials

## Troubleshooting
- If the credential still shows "Docker Hub" as username, the credential is not properly configured
- Make sure the credential ID matches exactly: `docker-hub-pass`
- Check that the credential scope is set to "Global"
