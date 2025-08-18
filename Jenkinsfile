pipeline {
    agent any

    stages {
        stage('Checkout') {
            steps {
                git branch: 'main', url: 'git@github.com:your-repo/task-manager.git'
            }
        }

        stage('Build Backend') {
            steps {
                dir('backend') {
                    sh './gradlew clean build'
                }
            }
        }

        stage('Build Frontend') {
            steps {
                dir('frontend') {
                    script {
                        docker.image('node:18').inside {
                            sh 'npm install'
                            sh 'npm run build'
                        }
                    }
                }
            }
        }

        stage('Build Docker Images') {
            steps {
                sh 'docker build -t backend ./backend'
                sh 'docker build -t frontend ./frontend'
            }
        }

        stage('Push Docker Images') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'dockerhub-creds', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                    sh 'echo $DOCKER_PASS | docker login -u $DOCKER_USER --password-stdin'
                    sh 'docker tag backend $DOCKER_USER/backend:latest'
                    sh 'docker tag frontend $DOCKER_USER/frontend:latest'
                    sh 'docker push $DOCKER_USER/backend:latest'
                    sh 'docker push $DOCKER_USER/frontend:latest'
                }
            }
        }

        stage('Deploy to Server') {
            steps {
                sshagent(['gcp-ssh-key']) {
                    sh 'ssh -o StrictHostKeyChecking=no mehan@34.14.197.81 "docker pull $DOCKER_USER/backend:latest && docker pull $DOCKER_USER/frontend:latest && docker-compose -f ~/docker-compose.yml up -d"'
                }
            }
        }
    }
}

