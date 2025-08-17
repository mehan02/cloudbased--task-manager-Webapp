pipeline {
    agent any
    environment {
        DOCKER_CREDS = credentials('docker-hub-pass')
        PROD_SERVER = "ubuntu@34.14.197.81"
    }

    stages {
        stage('Build Projects') {
            parallel {
                stage('Backend Build') {
                    steps {
                        dir('backend') {
                            sh './gradlew clean build --parallel --info'
                        }
                    }
                }
                stage('Frontend Build') {
                    steps {
                        dir('frontend') {
                            nodejs(nodeJSInstallationName: 'Node_20') {
                                sh 'npm ci'
                                sh 'npm run build'
                            }
                        }
                    }
                }
            }
        }

        stage('Docker Login') {
            steps {
                sh '''
                    echo "$DOCKER_CREDS_PSW" | docker login \
                        -u "$DOCKER_CREDS_USR" \
                        --password-stdin
                '''
            }
        }

        stage('Docker Build & Push') {
            parallel {
                stage('Backend Image') {
                    steps {
                        dir('backend') {
                            sh '''
                                docker build --pull --no-cache \
                                    -t "$DOCKER_CREDS_USR/my-backend:latest" .
                                docker push "$DOCKER_CREDS_USR/my-backend:latest"
                            '''
                        }
                    }
                }
                stage('Frontend Image') {
                    steps {
                        dir('frontend') {
                            sh '''
                                docker build --pull --no-cache \
                                    -t "$DOCKER_CREDS_USR/my-frontend:latest" .
                                docker push "$DOCKER_CREDS_USR/my-frontend:latest"
                            '''
                        }
                    }
                }
            }
        }
        
        stage('Deploy to Production Server') {
            when {
                branch 'main'  // Only deploy from main branch
            }
            steps {
                sshagent(['gcp-prod-server']) {
                    sh '''
                        ssh -o StrictHostKeyChecking=no '"'"${PROD_SERVER}"'"' '
                            # Docker operations
                            echo "'"'"${DOCKER_CREDS_PSW}"'"'" | docker login -u "'"'"${DOCKER_CREDS_USR}"'"'" --password-stdin
                            docker pull "'"'"${DOCKER_CREDS_USR}"'"'"/my-backend:latest
                            docker pull "'"'"${DOCKER_CREDS_USR}"'"'"/my-frontend:latest
                            
                            # Stop and remove existing containers
                            docker stop task-backend || true
                            docker rm task-backend || true
                            docker stop task-frontend || true
                            docker rm task-frontend || true
                            
                            # Start new containers
                            docker run -d --name task-backend -p 8080:8080 "'"'"${DOCKER_CREDS_USR}"'"'"/my-backend:latest
                            docker run -d --name task-frontend -p 80:80 "'"'"${DOCKER_CREDS_USR}"'"'"/my-frontend:latest
                        '
                    '''
                }
            }
        }
    }

    post {
        always {
            sh 'docker logout'
            cleanWs()
        }
    }
}
