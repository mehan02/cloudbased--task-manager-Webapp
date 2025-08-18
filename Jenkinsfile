pipeline {
    agent any
    environment {
        PATH = "/usr/local/bin:/usr/bin:/bin"
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
                script {
                    def DB_USER = "taskmanager_user"
                    withCredentials([string(credentialsId: 'cloudsql-db-pass', variable: 'DB_PASS')]) {
                        sh """
                        export DB_USER=${DB_USER}
                        export DB_PASS=${DB_PASS}
                        docker-compose -f ./docker-compose.yml up -d
                        """
                    }
                }
            }
        }
    }
    post {
        always {
            cleanWs()
        }
    }
}

