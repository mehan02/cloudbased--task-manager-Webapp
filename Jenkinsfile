pipeline {
    agent any
    environment {
        DOCKER_CREDS = credentials('docker-hub-pass')
        PROD_SERVER = "ubuntu@34.93.252.145"
        DB_HOST = "34.14.211.97"
        DB_PORT = "5432"
        DB_NAME = "taskmanager"
        DB_USER = "db_user"
    }

    stages {
        stage('Verify Tools') {
            steps {
                script {
                    sh '''
                        echo "Checking Docker access..."
                        docker ps
                        docker --version
                        echo "Docker accessible!"
                    '''
                }
            }
        }

        stage('Build Projects') {
            parallel {
                stage('Backend Build') {
                    steps {
                        dir('backend') {
                            withCredentials([string(credentialsId: 'cloudsql-db-pass', variable: 'DB_PASS')]) {
                                sh './gradlew clean build --parallel --info -Dspring.datasource.password=$DB_PASS'
                            }
                        }
                    }
                }
                stage('Frontend Build') {
                    steps {
                        dir('frontend') {
                            script {
                                try {
                                    nodejs(nodeJSInstallationName: 'Node_20') {
                                        sh 'npm ci'
                                        sh 'npm run build'
                                    }
                                } catch (err) {
                                    echo "Node_20 not configured, installing Node.js directly..."
                                    sh '''
                                        curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
                                        sudo apt-get install -y nodejs
                                        npm ci
                                        npm run build
                                    '''
                                }
                            }
                        }
                    }
                }
            }
        }

        stage('Docker Operations') {
            steps {
                script {
                    withCredentials([usernamePassword(
                        credentialsId: 'docker-hub-pass',
                        usernameVariable: 'DOCKER_USER',
                        passwordVariable: 'DOCKER_PASS'
                    )]) {
                        sh '''
                            echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin
                            
                            # Backend
                            cd backend
                            docker build --pull --no-cache -t "$DOCKER_USER/task-backend:latest" .
                            docker push "$DOCKER_USER/task-backend:latest"
                            
                            # Frontend
                            cd ../frontend
                            docker build --pull --no-cache -t "$DOCKER_USER/task-frontend:latest" .
                            docker push "$DOCKER_USER/task-frontend:latest"
                        '''
                    }
                }
            }
        }

        stage('Deploy to Production') {
            steps {
                sshagent(['gcp-prod-server']) {
                    withCredentials([string(credentialsId: 'cloudsql-db-pass', variable: 'DB_PASS')]) {
                        sh '''
                            ssh -o StrictHostKeyChecking=no ${PROD_SERVER} '
                                # Docker login
                                echo "${DOCKER_CREDS_PSW}" | docker login -u "${DOCKER_CREDS_USR}" --password-stdin
                                
                                # Pull latest images
                                docker pull ${DOCKER_CREDS_USR}/task-backend:latest
                                docker pull ${DOCKER_CREDS_USR}/task-frontend:latest
                                
                                # Stop and remove old containers
                                docker stop task-backend || true
                                docker rm task-backend || true
                                docker stop task-frontend || true
                                docker rm task-frontend || true
                                
                                # Run Backend container with DB credentials
                                docker run -d --name task-backend -p 8080:8080 \\
                                    -e SPRING_DATASOURCE_URL=jdbc:postgresql://${DB_HOST}:${DB_PORT}/${DB_NAME} \\
                                    -e SPRING_DATASOURCE_USERNAME=${DB_USER} \\
                                    -e SPRING_DATASOURCE_PASSWORD=${DB_PASS} \\
                                    ${DOCKER_CREDS_USR}/task-backend:latest
                                
                                # Run Frontend container
                                docker run -d --name task-frontend -p 80:80 \\
                                    ${DOCKER_CREDS_USR}/task-frontend:latest
                            '
                        '''
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

