pipeline {
    agent any

    environment {
        DB_HOST = '34.93.252.145' 
        DB_NAME = 'taskmanager'
        DB_USER = 'taskuser'
        DB_PASS = credentials('cloudsql-db-pass')   
    }

    stages {
        stage('Checkout') {
            steps {
                git(
                    url: 'https://github.com/mehan02/cloudbased--task-manager-.git',
                    branch: 'main',
                    credentialsId: 'github-pat'
                )
            }
        }

        stage('Build Backend') {
            steps {
                dir('backend') {
                    sh './gradlew clean build -x test'
                }
            }
        }

        stage('Build Frontend') {
            steps {
                dir('frontend') {
                    sh 'npm install'
                    sh 'npm run build'
                }
            }
        }

        stage('Docker Build & Push') {
            steps {
                script {
                    docker.withRegistry('', 'docker-hub-cred') {
                        dir('backend') {
                            sh 'docker build -t mehan02/taskmanager-backend:latest .'
                            sh 'docker push mehan02/taskmanager-backend:latest'
                        }
                        dir('frontend') {
                            sh 'docker build -t mehan02/taskmanager-frontend:latest .'
                            sh 'docker push mehan02/taskmanager-frontend:latest'
                        }
                    }
                }
            }
        }

        stage('Deploy to VM') {
            steps {
                sshagent(['gcp-ssh-key']) {
                    sh '''
                        ssh -o StrictHostKeyChecking=no mehan@34.14.197.81 << EOF
                            docker pull mehan02/taskmanager-backend:latest
                            docker pull mehan02/taskmanager-frontend:latest

                            docker stop backend || true && docker rm backend || true
                            docker stop frontend || true && docker rm frontend || true

                            docker run -d --name backend -p 8080:8080 \
                                -e SPRING_DATASOURCE_URL=jdbc:mysql://${DB_HOST}:3306/${DB_NAME} \
                                -e SPRING_DATASOURCE_USERNAME=${DB_USER} \
                                -e SPRING_DATASOURCE_PASSWORD=${DB_PASS} \
                                mehan02/taskmanager-backend:latest

                            docker run -d --name frontend -p 80:80 \
                                mehan02/taskmanager-frontend:latest
                        EOF
                    '''
                }
            }
        }
    }
}
