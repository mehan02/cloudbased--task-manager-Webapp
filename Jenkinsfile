pipeline {
    agent any

    environment {
        NODEJS_HOME = tool name: 'Node_20', type: 'NodeJS'
        JAVA_HOME = tool name: 'Java17', type: 'jdk'
        PATH = "${env.NODEJS_HOME}/bin:${JAVA_HOME}/bin:${env.PATH}"
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
                // Example: sh 'docker run -d -p 80:80 my-frontend'
            }
        }
    }

    post {
        always {
            script {
                cleanWs()
            }
        }
    }
}
