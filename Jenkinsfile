pipeline {
    agent any

    tools {
        nodejs 'Node_20'   
        jdk 'Java17'       
    }

    environment {
        PATH = "${env.JAVA_HOME}/bin:${env.NODEJS_HOME}/bin:${env.PATH}"
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
                    echo "=== Versions ==="
                    echo "Node path: ${env.NODEJS_HOME}"
                    echo "Java path: ${env.JAVA_HOME}"
                    docker --version
                    node -v
                    npm -v
                    ./backend/gradlew --version
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
                    sh './gradlew clean build'
                }
            }
        }

        stage('Docker Build Frontend') {
            steps {
                dir('frontend') {
                    sh 'DOCKER_BUILDKIT=0 docker build -t my-frontend .'
                }
            }
        }

        stage('Docker Build Backend') {
            steps {
                dir('backend') {
                    sh 'DOCKER_BUILDKIT=0 docker build -t my-backend .'
                }
            }
        }

        stage('Deploy') {
            steps {
                echo 'Deployment steps go here...'
            }
        }
    }

    post {
        always {
            cleanWs()
        }
    }
}
