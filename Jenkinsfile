pipeline {
    agent any
    environment {
        DOCKER_REGISTRY = "docker.io"
        DOCKER_CREDS = credentials('docker-hub-pass') // Auto-injects DOCKER_CREDS_USR and DOCKER_CREDS_PSW
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
                script {
                    sh """
                    echo ${env.DOCKER_CREDS_PSW} | docker login \
                        -u ${env.DOCKER_CREDS_USR} \
                        --password-stdin ${env.DOCKER_REGISTRY}
                    """
                }
            }
        }

        stage('Docker Build & Push') {
            parallel {
                stage('Backend Image') {
                    steps {
                        script {
                            def backendImage = docker.build("${env.DOCKER_CREDS_USR}/my-backend:latest", "--pull --no-cache ./backend")
                            backendImage.push()
                        }
                    }
                }
                stage('Frontend Image') {
                    steps {
                        script {
                            def frontendImage = docker.build("${env.DOCKER_CREDS_USR}/my-frontend:latest", "--pull --no-cache ./frontend")
                            frontendImage.push()
                        }
                    }
                }
            }
        }
    }

    post {
        always {
            sh 'docker logout'
        }
        cleanup {
            cleanWs() // Clean workspace after build
        }
    }
}
