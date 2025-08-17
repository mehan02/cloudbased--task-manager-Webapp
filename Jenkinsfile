pipeline {
    agent any

    environment {
        PROD_SERVER = "34.93.252.145"       // GCP VM Public IP
        DB_HOST     = "34.14.211.97"
        DB_PORT     = "5432"
        DB_NAME     = "taskmanager"
        DB_USER     = "db_user"
    }

    stages {

        stage('Verify Tools') {
            steps {
                sh '''
                    echo "Checking Docker access..."
                    docker ps
                    docker --version
                    echo "Docker accessible!"
                '''
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
                                        sh 'npm ci && npm run build'
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

        stage('Deploy to Production') {
            steps {
                withCredentials([
                    string(credentialsId: 'cloudsql-db-pass', variable: 'DB_PASS'),
                    usernamePassword(credentialsId: 'docker-hub-pass', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS'),
                    usernamePassword(credentialsId: 'gcp-prod-server', usernameVariable: 'SSH_USER', passwordVariable: 'SSH_PASS')
                ]) {
                    sh '''
                        sshpass -p "$SSH_PASS" ssh -o StrictHostKeyChecking=no $SSH_USER@${PROD_SERVER} "
                            # Docker login on prod server
                            echo \\"$DOCKER_PASS\\" | docker login -u \\"$DOCKER_USER\\" --password-stdin

                            # Pull latest images
                            docker pull $DOCKER_USER/task-backend:latest
                            docker pull $DOCKER_USER/task-frontend:latest

                            # Stop & remove old containers
                            docker stop task-backend || true
                            docker rm task-backend || true
                            docker stop task-frontend || true
                            docker rm task-frontend || true

                            # Run backend container
                            docker run -d --name task-backend -p 8080:8080 \\
                                -e SPRING_DATASOURCE_URL=jdbc:postgresql://${DB_HOST}:${DB_PORT}/${DB_NAME} \\
                                -e SPRING_DATASOURCE_USERNAME=${DB_USER} \\
                                -e SPRING_DATASOURCE_PASSWORD=${DB_PASS} \\
                                $DOCKER_USER/task-backend:latest

                            # Run frontend container
                            docker run -d --name task-frontend -p 80:80 $DOCKER_USER/task-frontend:latest
                        "
                    '''
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

