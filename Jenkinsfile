pipeline {
    agent any

    tools {
        // Uses Jenkins NodeJS plugin
        nodejs "Node_20"
    }

    stages {
        stage('Verify Tools') {
            steps {
                sh '''
                    echo "=== Docker Version ==="
                    docker --version

                    echo "=== NodeJS Version ==="
                    node -v

                    echo "=== NPM Version ==="
                    npm -v

                    echo "=== Gradle Wrapper Version ==="
                    cd backend
                    ./gradlew --version
                '''
            }
        }

        stage('Install Frontend Dependencies') {
            steps {
                dir('frontend') {
                    sh 'npm install'
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

        stage('Docker Build & Push') {
            steps {
                sh '''
                    echo "Building Docker images..."
                    docker build -t my-frontend ./frontend
                    docker build -t my-backend ./backend

                    echo "Cleaning up dangling images..."
                    docker image prune -f
                '''
            }
        }

        stage('Deploy to Server') {
            steps {
                sshagent(['deploy-server-ssh']) {
                    sh '''
                        ssh -o StrictHostKeyChecking=no ubuntu@35.244.27.174 "
                            docker stop my-frontend || true &&
                            docker rm my-frontend || true &&
                            docker stop my-backend || true &&
                            docker rm my-backend || true &&

                            docker run -d -p 80:80 --name my-frontend my-frontend &&
                            docker run -d -p 8080:8080 --name my-backend my-backend
                        "
                    '''
                }
            }
        }
    }
}

