pipeline {
    agent any

    tools {
        nodejs 'Node_20'  
        jdk 'Java17'      
    }

    environment {
        // Combine paths safely
        PATH = "${env.JAVA_HOME}/bin:${env.NODEJS_HOME}/bin:${env.PATH}"
        // Enable Docker BuildKit by default
        DOCKER_BUILDKIT = "1"
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
                    echo "=== Tool Versions ==="
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
                    sh './gradlew clean build -x test'
                }
            }
        }

        stage('Docker Build Frontend') {
            steps {
                dir('frontend') {
                    sh '''
                        # Retry on Docker Hub failures
                        for i in {1..3}; do
                            docker build -t my-frontend . && break
                            sleep 10
                        done
                    '''
                }
            }
        }

        stage('Docker Build Backend') {
            steps {
                dir('backend') {
                    sh '''
                        # Retry with BuildKit enabled
                        for i in {1..3}; do
                            docker build -t my-backend . && break
                            sleep 10
                        done
                    '''
                }
            }
        }

        stage('Deploy') {
            steps {
                echo 'Deployment would happen here'
                // Example:
                // sh 'docker-compose up -d'
            }
        }
    }

    post {
        always {
            cleanWs()
        }
        failure {
            slackSend channel: '#builds',
                     message: "Build Failed: ${env.JOB_NAME} #${env.BUILD_NUMBER}"
        }
    }
}
