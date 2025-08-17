pipeline {
    agent any
    environment {
        DOCKER_CREDS = credentials('docker-hub-pass')   // DockerHub credentials (username+password)
        PROD_SERVER = "34.93.252.145"                   // GCP VM Public IP
        PROD_USER   = "ubuntu"                          // VM Username
        PROD_PASS   = credentials('gcp-prod-server') // VM Password stored in Jenkins credentials
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
                withCredentials([string(credentialsId: 'cloudsql-db-pass', variable: 'DB_PASS')]) {
                    withCredentials([usernamePassword(
                        credentialsId: 'docker-hub-pass',
                        usernameVariable: 'DOCKER_USER',
                        passwordVariable: 'DOCKER_PASS'
                    )]) {
                        withCredentials([usernamePassword(
                            credentialsId: 'gcp-prod-server',
                            usernameVariable: 'SSH_USER',
                            passwordVariable: 'SSH_PASS'
                        )]) {
                            sh '''
                                sshpass -p "$SSH_PASS" ssh -o StrictHostKeyChecking=no $SSH_USER@${PROD_SERVER} "
                                    echo \\"$DOCKER_PASS\\" | docker login -u \\"$DOCKER_USER\\" --password-stdin
                                    
                                    docker pull $DOCKER_USER/task-backend:latest
                                    docker pull $DOCKER_USER/task-frontend:latest
                                    
                                    docker stop task-backend || true
                                    docker rm task-backend || true
                                    docker stop task-frontend || true
                                    docker rm task-frontend || true
                                    
                                    docker run -d --name task-backend -p 8080:8080 \\
                                        -e SPRING_DATASOURCE_URL=jdbc:postgresql://${DB_HOST}:${DB_PORT}/${DB_NAME} \\
                                        -e SPRING_DATASOURCE_USERNAME=${DB_USER} \\
                                        -e SPRING_DATASOURCE_PASSWORD=${DB_PASS} \\
                                        $DOCKER_USER/task-backend:latest
                                    
                                    docker run -d --name task-frontend -p 80:80 \\
                                        $DOCKER_USER/task-frontend:latest
                                "
                            '''
                        }
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
