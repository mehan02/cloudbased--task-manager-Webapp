pipeline {
    agent any
    environment {
        DOCKER_REGISTRY = "docker.io"
        // Secure credential binding without interpolation
        DOCKER_USER = credentials('docker-hub-pass').username
        DOCKER_PASS = credentials('docker-hub-pass').password
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
                // Secure credential usage with single quotes
                sh '''
                    echo "$DOCKER_PASS" | docker login \
                        -u "$DOCKER_USER" \
                        --password-stdin "$DOCKER_REGISTRY"
                '''
            }
        }

        stage('Docker Build & Push') {
            parallel {
                stage('Backend Image') {
                    steps {
                        dir('backend') {
                            // Using shell commands instead of docker object
                            sh '''
                                docker build --pull --no-cache \
                                    -t "$DOCKER_USER/my-backend:latest" .
                                docker push "$DOCKER_USER/my-backend:latest"
                            '''
                        }
                    }
                }
                stage('Frontend Image') {
                    steps {
                        dir('frontend') {
                            sh '''
                                docker build --pull --no-cache \
                                    -t "$DOCKER_USER/my-frontend:latest" .
                                docker push "$DOCKER_USER/my-frontend:latest"
                            '''
                        }
                    }
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
