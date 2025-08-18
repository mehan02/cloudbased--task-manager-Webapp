pipeline {
    agent any

    environment {
        PROD_SERVER = "34.14.197.81"
        DB_HOST     = "34.14.211.97"
        DB_PORT     = "5432"
        DB_NAME     = "taskmanager-db"
        DB_USER     = "taskuser"
    }

    stages {

        stage('Verify Tools') {
            steps {
                sh 'docker --version; node -v; ./gradlew --version'
            }
        }

        stage('Build Projects') {
            parallel {
                stage('Backend Build') {
                    steps {
                        dir('backend') {
                            withCredentials([string(credentialsId: 'cloudsql-db-pass', variable: 'DB_PASS')]) {
                                sh './gradlew clean build --parallel --info -Dspring.datasource.password=$DB_PASS'
                            }
                        }
                    }
                }

                stage('Frontend Build') {
                    steps {
                        dir('frontend') {
                            nodejs(nodeJSInstallationName: 'Node_20') {
                                sh 'npm ci && npm run build'
                            }
                        }
                    }
                }
            }
        }

        stage('Docker Build & Push') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'docker-hub-pass',
                    usernameVariable: 'DOCKER_USER',
                    passwordVariable: 'DOCKER_PASS'
                )]) {
                    sh '''
                        echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin
                        cd backend
                        docker build --pull --no-cache -t "$DOCKER_USER/task-backend:latest" .
                        docker push "$DOCKER_USER/task-backend:latest"
                        cd ../frontend
                        docker build --pull --no-cache -t "$DOCKER_USER/task-frontend:latest" .
                        docker push "$DOCKER_USER/task-frontend:latest"
                    '''
                }
            }
        }

        stage('Deploy to Production') {
            steps {
                sshagent(['gcp-prod-server']) {
                    withCredentials([string(credentialsId: 'cloudsql-db-pass', variable: 'DB_PASS'),
                                     usernamePassword(credentialsId: 'docker-hub-pass', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                        sh """
                            ssh -o StrictHostKeyChecking=no $SSH_USER@${PROD_SERVER} '
                                echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin
                                docker pull $DOCKER_USER/task-backend:latest
                                docker pull $DOCKER_USER/task-frontend:latest
                                docker stop task-backend || true && docker rm task-backend || true
                                docker stop task-frontend || true && docker rm task-frontend || true
                                docker run -d --name task-backend -p 8081:8081 \\
                                    -e SPRING_DATASOURCE_URL=jdbc:postgresql://${DB_HOST}:${DB_PORT}/${DB_NAME} \\
                                    -e SPRING_DATASOURCE_USERNAME=${DB_USER} \\
                                    -e SPRING_DATASOURCE_PASSWORD=${DB_PASS} \\
                                    $DOCKER_USER/task-backend:latest
                                docker run -d --name task-frontend -p 80:80 $DOCKER_USER/task-frontend:latest
                                docker system prune -f
                            '
                        """
                    }
                }
            }
        }

    }

    post {
        always {
            sh 'docker logout || true'
            cleanWs()
        }
    }

}
