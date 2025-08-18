pipeline {
    agent any

    tools {
        nodejs 'Node_20'
        jdk 'Java17'
    }

    environment {
        PATH = "${env.JAVA_HOME}/bin:${env.NODEJS_HOME}/bin:${env.PATH}"
        DOCKER_BUILDKIT = "1"
        BACKEND_DB_USER = "taskuser"
        BACKEND_DB_NAME = "taskmanager"
        BACKEND_DB_HOST = "34.14.197.81" // Public IP of GCP Cloud SQL or proxy host
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
                sh """
                    echo "=== Tool Versions ==="
                    echo "Node: \$(node -v)"
                    echo "NPM: \$(npm -v)"
                    echo "Java: \$(java -version 2>&1 | head -n 1)"
                    echo "Gradle: \$(./backend/gradlew --version | grep 'Gradle')"
                    docker --version
                """
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
                        for i in {1..3}; do
                            docker build -t my-frontend . && break
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
                        for i in {1..3}; do
                            docker build -t my-backend . && break
                            sleep 10
                        done
                    '''
                }
            }
        }

        stage('Deploy') {
            steps {
                withCredentials([string(credentialsId: 'cloudsql-db-pass', variable: 'BACKEND_DB_PASS')]) {
                    sh """
                        ssh -i ${SSH_KEY} -o StrictHostKeyChecking=no ${REMOTE_USER}@${REMOTE_HOST} '
                            # Stop & remove old containers and images
                            docker stop my-backend || true
                            docker rm my-backend || true
                            docker rmi my-backend || true
                            docker stop my-frontend || true
                            docker rm my-frontend || true
                            docker rmi my-frontend || true
                            
                            # Ensure directories exist
                            mkdir -p /home/${REMOTE_USER}/frontend
                            mkdir -p /home/${REMOTE_USER}/backend
                        '
                        
                        # Copy frontend & backend builds
                        scp -i ${SSH_KEY} -o StrictHostKeyChecking=no -r frontend/build/* ${REMOTE_USER}@${REMOTE_HOST}:/home/${REMOTE_USER}/frontend/
                        scp -i ${SSH_KEY} -o StrictHostKeyChecking=no backend/build/libs/backend.jar ${REMOTE_USER}@${REMOTE_HOST}:/home/${REMOTE_USER}/backend/
                        
                        # Deploy Docker containers
                        ssh -i ${SSH_KEY} -o StrictHostKeyChecking=no ${REMOTE_USER}@${REMOTE_HOST} '
                            docker run -d --name my-frontend -p 80:80 my-frontend
                            docker run -d --name my-backend \
                                -p 8080:8080 \
                                -e DB_HOST=${BACKEND_DB_HOST} \
                                -e DB_USER=${BACKEND_DB_USER} \
                                -e DB_NAME=${BACKEND_DB_NAME} \
                                -e DB_PASS=$BACKEND_DB_PASS \
                                my-backend
                        '
                    """
                }
            }
        }
    }

    post {
        always {
            cleanWs()
        }
        failure {
            slackSend channel: '#builds',
                     message: "Build Failed: ${env.JOB_NAME} #${env.BUILD_NUMBER}"
        }
    }
}

