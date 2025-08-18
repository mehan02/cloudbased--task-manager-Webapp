pipeline {
    agent any
    tools {
        nodejs "Node_20"
        jdk "Java17"
    }
    environment {
        DOCKER_BUILDKIT = 1
        DB_PASS = credentials('cloudsql-db-pass') // secret text
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
                echo === Versions ===
                node -v
                npm -v
                docker --version
                ./backend/gradlew --version
                '''
            }
        }

        stage('Install Frontend Dependencies') {
            steps {
                dir('frontend') {
                    sh 'npm ci --no-audit'
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
                    sh './gradlew clean build -x test --no-daemon'
                }
            }
        }

        stage('Docker Build') {
            steps {
                dir('frontend') {
                    sh 'docker build -t my-frontend .'
                }
                dir('backend') {
                    sh 'docker build -t my-backend .'
                }
                sh 'docker image prune -f --filter until=24h'
            }
        }

        stage('Deploy') {
            steps {
                echo "Deploying with DB_PASS=${env.DB_PASS}"
            }
        }
    }
    post {
        always {
            cleanWs()
        }
    }
}

