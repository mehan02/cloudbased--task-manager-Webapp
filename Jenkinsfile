pipeline {
    agent any

    tools {
        nodejs 'Node_20'  // Ensure this matches Jenkins' NodeJS installation name exactly
        jdk 'Java17'     // Ensure this matches Jenkins' JDK installation name exactly
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
                sh """
                    echo "=== Versions ==="
                    echo "Node: \$(node -v)"
                    echo "NPM: \$(npm -v)"
                    echo "Java: \$(java -version 2>&1 | head -n 1)"
                    echo "Gradle: \$(./backend/gradlew --version | grep 'Gradle')"
                    docker --version
                """
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
