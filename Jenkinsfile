pipeline {
    agent any

    environment {
        // Docker Hub Configuration
        DOCKER_REGISTRY = 'docker.io'
        DOCKER_IMAGE_BACKEND = 'mehan02/task-manager-backend'
        DOCKER_IMAGE_FRONTEND = 'mehan02/task-manager-frontend'
        DOCKER_TAG = "${env.BUILD_NUMBER}"
        
        // Production Server Configuration
        PROD_SERVER = '34.14.197.81'
        PROD_USER = 'samarajeewamehan'
        
        // Database Configuration
        DB_HOST = '34.14.211.97'
        DB_PORT = '5432'
        DB_NAME = 'taskmanager'
        DB_USER = 'taskuser'
        
        // Application Ports
        BACKEND_PORT = '8081'
        FRONTEND_PORT = '80'
        
        // Container Names
        BACKEND_CONTAINER = 'task-manager-backend'
        FRONTEND_CONTAINER = 'task-manager-frontend'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
                echo "✅ Code checked out successfully"
            }
        }

        stage('Database Health Check') {
            steps {
                echo "🔍 Checking database connectivity..."
                script {
                    checkDatabaseConnection()
                }
            }
        }

        stage('Build Backend') {
            steps {
                dir('backend') {
                    echo "🔨 Building Backend with Gradle..."
                    sh '''
                        chmod +x ./gradlew
                        ./gradlew clean build -x test
                    '''
                    echo "✅ Backend build completed"
                }
            }
            post {
                always {
                    dir('backend') {
                        archiveArtifacts artifacts: 'build/libs/*.jar', fingerprint: true
                    }
                }
            }
        }

        stage('Build Frontend') {
            steps {
                dir('frontend') {
                    echo "🔨 Building Frontend with React..."
                    sh '''
                        npm ci
                        npm run build
                    '''
                    echo "✅ Frontend build completed"
                }
            }
            post {
                always {
                    dir('frontend') {
                        archiveArtifacts artifacts: 'build/**/*', fingerprint: true
                    }
                }
            }
        }

        stage('Create Docker Images') {
            parallel {
                stage('Build Backend Docker Image') {
                    steps {
                        dir('backend') {
                            echo "🐳 Building Backend Docker image..."
                            script {
                                docker.build("${DOCKER_IMAGE_BACKEND}:${DOCKER_TAG}")
                                docker.build("${DOCKER_IMAGE_BACKEND}:latest")
                            }
                            echo "✅ Backend Docker image built"
                        }
                    }
                }
                
                stage('Build Frontend Docker Image') {
                    steps {
                        dir('frontend') {
                            echo "🐳 Building Frontend Docker image..."
                            script {
                                docker.build("${DOCKER_IMAGE_FRONTEND}:${DOCKER_TAG}")
                                docker.build("${DOCKER_IMAGE_FRONTEND}:latest")
                            }
                            echo "✅ Frontend Docker image built"
                        }
                    }
                }
            }
        }

        stage('Push to Docker Hub') {
            steps {
                echo "📤 Pushing images to Docker Hub..."
                script {
                    withCredentials([usernamePassword(credentialsId: 'docker-hub-pass', usernameVariable: 'DOCKER_USERNAME', passwordVariable: 'DOCKER_PASSWORD')]) {
                        sh '''
                            echo $DOCKER_PASSWORD | docker login -u $DOCKER_USERNAME --password-stdin
                            
                            # Push Backend images
                            docker push ${DOCKER_IMAGE_BACKEND}:${DOCKER_TAG}
                            docker push ${DOCKER_IMAGE_BACKEND}:latest
                            
                            # Push Frontend images
                            docker push ${DOCKER_IMAGE_FRONTEND}:${DOCKER_TAG}
                            docker push ${DOCKER_IMAGE_FRONTEND}:latest
                        '''
                    }
                }
                echo "✅ Images pushed to Docker Hub successfully"
            }
        }

        stage('Deploy to Production') {
            steps {
                echo "🚀 Deploying to Production Server..."
                script {
                    deployToProduction()
                }
                echo "✅ Deployment completed successfully"
            }
        }
    }

    post {
        always {
            echo "🧹 Cleaning up Docker images..."
            sh '''
                docker rmi ${DOCKER_IMAGE_BACKEND}:${DOCKER_TAG} || true
                docker rmi ${DOCKER_IMAGE_BACKEND}:latest || true
                docker rmi ${DOCKER_IMAGE_FRONTEND}:${DOCKER_TAG} || true
                docker rmi ${DOCKER_IMAGE_FRONTEND}:latest || true
            '''
        }
        success {
            echo "🎉 Pipeline completed successfully!"
            script {
                // Send notification or update status
                echo "Application deployed to: http://${PROD_SERVER}"
                echo "Backend API: http://${PROD_SERVER}:${BACKEND_PORT}"
                echo "Frontend: http://${PROD_SERVER}:${FRONTEND_PORT}"
            }
        }
        failure {
            echo "❌ Pipeline failed!"
            script {
                // Rollback logic - stop containers if they were started
                echo "🔄 Attempting rollback..."
                try {
                    sshagent(['gcp-prod-server']) {
                        sh """
                            ssh -o StrictHostKeyChecking=no ${PROD_USER}@${PROD_SERVER} << 'ROLLBACK_SCRIPT'
                                echo "🛑 Stopping containers due to pipeline failure..."
                                docker stop ${BACKEND_CONTAINER} || true
                                docker rm ${BACKEND_CONTAINER} || true
                                docker stop ${FRONTEND_CONTAINER} || true
                                docker rm ${FRONTEND_CONTAINER} || true
                                echo "✅ Rollback completed"
                            ROLLBACK_SCRIPT
                        """
                    }
                } catch (Exception e) {
                    echo "⚠️ Rollback failed: ${e.getMessage()}"
                }
            }
            // Add notification logic here if needed
        }
    }
}

def checkDatabaseConnection() {
    withCredentials([string(credentialsId: 'cloudsql-db-pass', variable: 'DB_PASSWORD')]) {
        sh '''
            echo "Testing PostgreSQL connection to ${DB_HOST}:${DB_PORT}..."
            
            # Check if PostgreSQL client is available
            if command -v psql >/dev/null 2>&1; then
                echo "Using psql client..."
                PGPASSWORD="${DB_PASSWORD}" psql -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${DB_NAME} -c "SELECT 1;" || {
                    echo "❌ Database connection failed with psql"
                    exit 1
                }
            else
                echo "psql not available, using telnet to check port connectivity..."
                timeout 10 telnet ${DB_HOST} ${DB_PORT} || {
                    echo "❌ Cannot connect to database port"
                    exit 1
                }
            fi
            
            echo "✅ Database connection successful"
        '''
    }
}

def deployToProduction() {
    withCredentials([
        usernamePassword(credentialsId: 'docker-hub-pass', usernameVariable: 'DOCKER_USERNAME', passwordVariable: 'DOCKER_PASSWORD'),
        string(credentialsId: 'cloudsql-db-pass', variable: 'DB_PASSWORD'),
        sshUserPrivateKey(credentialsId: 'gcp-prod-server', keyFileVariable: 'SSH_KEY', usernameVariable: 'SSH_USER')
    ]) {
        sshagent(['gcp-prod-server']) {
            sh """
                ssh -o StrictHostKeyChecking=no ${PROD_USER}@${PROD_SERVER} << 'REMOTE_SCRIPT'
                    set -e
                    echo "🔐 Logging into Docker Hub..."
                    echo '${DOCKER_PASSWORD}' | docker login -u '${DOCKER_USERNAME}' --password-stdin
                    
                    echo "📥 Pulling latest Docker images..."
                    docker pull ${DOCKER_IMAGE_BACKEND}:latest
                    docker pull ${DOCKER_IMAGE_FRONTEND}:latest
                    
                    echo "🛑 Stopping old containers..."
                    docker stop ${BACKEND_CONTAINER} || true
                    docker rm ${BACKEND_CONTAINER} || true
                    docker stop ${FRONTEND_CONTAINER} || true
                    docker rm ${FRONTEND_CONTAINER} || true
                    
                    echo "🚀 Starting new Backend container..."
                    docker run -d \\
                        --name ${BACKEND_CONTAINER} \\
                        --restart unless-stopped \\
                        -p ${BACKEND_PORT}:8081 \\
                        -e SPRING_DATASOURCE_URL="jdbc:postgresql://${DB_HOST}:${DB_PORT}/${DB_NAME}" \\
                        -e SPRING_DATASOURCE_USERNAME="${DB_USER}" \\
                        -e SPRING_DATASOURCE_PASSWORD="${DB_PASSWORD}" \\
                        -e SPRING_PROFILES_ACTIVE=prod \\
                        -e DB_PASS="${DB_PASSWORD}" \\
                        ${DOCKER_IMAGE_BACKEND}:latest
                    
                    echo "🚀 Starting new Frontend container..."
                    docker run -d \\
                        --name ${FRONTEND_CONTAINER} \\
                        --restart unless-stopped \\
                        -p ${FRONTEND_PORT}:80 \\
                        ${DOCKER_IMAGE_FRONTEND}:latest
                    
                    echo "⏳ Waiting for containers to be ready..."
                    sleep 10
                    
                    echo "🔍 Checking container status..."
                    docker ps
                    
                    echo "⏳ Waiting for backend to be ready..."
                    sleep 15
                    
                    echo "🔍 Testing backend connectivity..."
                    curl -f http://localhost:${BACKEND_PORT}/actuator/health || echo "Backend health check failed"
                    
                    echo "✅ Deployment completed!"
                    echo "Backend API: http://${PROD_SERVER}:${BACKEND_PORT}"
                    echo "Frontend: http://${PROD_SERVER}:${FRONTEND_PORT}"
                REMOTE_SCRIPT
            """
        }
    }
}
