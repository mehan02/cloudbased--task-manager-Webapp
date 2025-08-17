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
          stage('Deploy to Production Server') {
    when {
        branch 'main'
    }
    steps {
        sshagent(['prod-server-ssh']) {
            sh '''
            ssh -o StrictHostKeyChecking=no ubuntu@<YOUR_SERVER_IP> '
                docker pull mehan02/my-frontend:latest &&
                docker stop my-frontend || true &&
                docker rm my-frontend || true &&
                docker run -d -p 80:80 --name my-frontend mehan02/my-frontend:latest
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
