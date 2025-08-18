pipeline {
    agent any

    tools {
        nodejs 'Node_20'       // Jenkins global Node.js installation
        jdk 'Java17'           // Jenkins global JDK installation
    }

    environment {
        PATH = "${env.JAVA_HOME}/bin:${env.NODEJS_HOME}/bin:${env.PATH}"
        DOCKER_BUILDKIT = "1"

        // Database
        BACKEND_DB_USER = "taskuser"
        BACKEND_DB_NAME = "taskmanager"
        BACKEND_DB_HOST = "34.14.197.81" // Change if using Cloud SQL private IP

        // Remote server details
        REMOTE_USER = "samarajeewamehan"
        REMOTE_HOST = "34.14.197.81"
        SSH_KEY = "/var/lib/jenkins/.ssh/gcp-task-manager.pem"
    }

    stages {
        stage('Checkout SCM') {
            steps {
                checkout scm
            }
        }

        stage('Verify Tools') {
            steps {
                sh '''
                    echo "=== Tool Versions ==="
                    echo "Node: $(node -v)"
                    echo "NPM: $(npm -v)"
                    echo "Java: $(java -version 2>&1 | head -n 1)"
                    echo "Gradle: $(./backend/gradlew --version | grep 'Gradle')"
                    docker --version
                '''
            }
        }

        stage('Install Frontend Dependencies') {
            steps {
                dir('frontend') {
                    sh 'npm ci'
                }
            }
        }

        stage('Build Frontend') {
            steps {
                dir('frontend') {
                    sh 'npm run build'
                }
            }
        }

        stage('Build Backend') {
            steps {
                dir('backend') {
                    sh './gradlew clean build -x test'
                }
            }
        }

        stage('Docker Build Frontend') {
            steps {
                dir('frontend') {
                    sh '''
                        echo "Building frontend Docker image..."
                        for i in {1..3}; do
                            docker build -t my-frontend . && break
                            echo "Retrying Docker build for frontend..."
                            sleep 10
                        done
                    '''
                }
            }
        }

        stage('Docker Build Backend') {
            steps {
                dir('backend') {
                    sh '''
                        echo "Building backend Docker image..."
                        for i in {1..3}; do
                            docker build -t my-backend . && break
                            echo "Retrying Docker build for backend..."
                            sleep 10
                        done
                    '''
                }
            }
        }

        stage('Push Docker Images (Optional)') {
            when { expression { return false } } // Enable if you use DockerHub/GCP Artifact Registry
            steps {
                withCredentials([usernamePassword(credentialsId: 'dockerhub-creds', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                    sh '''
                        echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin
                        docker tag my-frontend myrepo/my-frontend:latest
                        docker tag my-backend myrepo/my-backend:latest
                        docker push myrepo/my-frontend:latest
                        docker push myrepo/my-backend:latest
                    '''
                }
            }
        }

        stage('Deploy') {
            steps {
                withCredentials([string(credentialsId: 'cloudsql-db-pass', variable: 'BACKEND_DB_PASS')]) {
                    sh '''
                        # Export DB password
                        export BACKEND_DB_PASS="${BACKEND_DB_PASS}"

                        echo "=== Cleaning up old containers on remote ==="
                        ssh -i "${SSH_KEY}" -o StrictHostKeyChecking=no ${REMOTE_USER}@${REMOTE_HOST} '
                            docker stop my-backend || true
                            docker rm my-backend || true
                            docker rmi my-backend || true
                            docker stop my-frontend || true
                            docker rm my-frontend || true
                            docker rmi my-frontend || true
                            mkdir -p /home/${REMOTE_USER}/frontend
                            mkdir -p /home/${REMOTE_USER}/backend
                        '

                        echo "=== Copying frontend build ==="
                        scp -i "${SSH_KEY}" -o StrictHostKeyChecking=no -r "$WORKSPACE/frontend/build/"* ${REMOTE_USER}@${REMOTE_HOST}:/home/${REMOTE_USER}/frontend/

                        echo "=== Copying backend JAR ==="
                        scp -i "${SSH_KEY}" -o StrictHostKeyChecking=no "$WORKSPACE/backend/build/libs/backend.jar" ${REMOTE_USER}@${REMOTE_HOST}:/home/${REMOTE_USER}/backend/

                        echo "=== Starting Docker containers on remote ==="
                        ssh -i "${SSH_KEY}" -o StrictHostKeyChecking=no ${REMOTE_USER}@${REMOTE_HOST} "
                            # Run frontend container
                            docker run -d --name my-frontend -p 80:80 my-frontend

                            # Run backend container
                            docker run -d --name my-backend \\
                                -p 8080:8080 \\
                                -e DB_HOST=${BACKEND_DB_HOST} \\
                                -e DB_USER=${BACKEND_DB_USER} \\
                                -e DB_NAME=${BACKEND_DB_NAME} \\
                                -e DB_PASS=${BACKEND_DB_PASS} \\
                                my-backend
                        "
                    '''
                }
            }
        }
    }

    post {
        always {
            cleanWs()
        }
        success {
            echo "✅ Deployment successful! App should be running on http://${env.REMOTE_HOST}"
        }
        failure {
            echo "❌ Deployment failed!"
            // slackSend channel: '#builds', message: "Build Failed: ${env.JOB_NAME} #${env.BUILD_NUMBER}"
        }
    }
}

