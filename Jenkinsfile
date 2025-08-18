pipeline {
    agent any

    tools {
        // Jenkins NodeJS plugin
        nodejs "Node_20"
    }

    environment {
        CLOUDSQL_CRED = "cloudsql-db-pass"    
        DB_HOST      = "34.14.211.97"        
        DB_NAME      = "taskmanager"          
        DB_USER      = "taskuser"            
    }

    stages {

        stage('Verify Tools') {
            steps {
                sh '''
                    echo "=== Docker Version ==="
                    docker --version

                    echo "=== NodeJS Version ==="
                    node -v

                    echo "=== NPM Version ==="
                    npm -v

                    echo "=== Gradle Wrapper Version ==="
                    cd backend
                    ./gradlew --version
                '''
            }
        }

        stage('Install Frontend Dependencies') {
            steps {
                dir('frontend') {
                    sh 'npm install'
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

        stage('Docker Build') {
            steps {
                sh '''
                    echo "Building Docker images..."
                    docker build -t my-frontend ./frontend
                    docker build -t my-backend ./backend

                    echo "Cleaning up dangling images..."
                    docker image prune -f
                '''
            }
        }

        stage('Deploy to Server') {
            steps {
                sshagent(['gcp-prod-server']) {
                    withCredentials([string(credentialsId: "${CLOUDSQL_CRED}", variable: 'DB_PASSWORD')]) {
                        sh """
                            ssh -o StrictHostKeyChecking=no ubuntu@<YOUR_SERVER_IP> '
                                # Stop and remove old containers
                                docker stop my-frontend || true && docker rm my-frontend || true
                                docker stop my-backend || true && docker rm my-backend || true

                                # Run frontend
                                docker run -d -p 80:80 --name my-frontend my-frontend

                                # Run backend with DB environment variables
                                docker run -d -p 8080:8080 --name my-backend \\
                                    -e SPRING_DATASOURCE_URL=jdbc:mysql://${DB_HOST}:3306/${DB_NAME} \\
                                    -e SPRING_DATASOURCE_USERNAME=${DB_USER} \\
                                    -e SPRING_DATASOURCE_PASSWORD=${DB_PASSWORD} \\
                                    my-backend
                            '
                        """
                    }
                }
            }
        }
    }

    post {
        always {
            sh 'docker logout || true'
            cleanWs()
        }
    }
}
