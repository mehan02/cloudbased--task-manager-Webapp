pipeline {
    agent any
    environment {
        DOCKER_CREDS = credentials('docker-hub-pass')
        PROD_SERVER = "ubuntu@34.93.252.145"            
        DB_HOST = "34.14.211.97"
        DB_PORT = "5432"
        DB_NAME = "taskmanager"
        DB_USER = "db_user"
    }

    stages {
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
                                sh 'npm ci'
                                sh 'npm run build'
                            }
                        }
                    }
                }
            }
        }

        stage('Docker Login') {
            steps {
                sh '''
                    echo "$DOCKER_CREDS_PSW" | docker login \
                        -u "$DOCKER_CREDS_USR" \
                        --password-stdin
                '''
            }
        }

        stage('Docker Build & Push') {
            parallel {
                stage('Backend Image') {
                    steps {
                        dir('backend') {
                            sh '''
                                docker build --pull --no-cache \
                                    -t "$DOCKER_CREDS_USR/task-backend:latest" .
                                docker push "$DOCKER_CREDS_USR/task-backend:latest"
                            '''
                        }
                    }
                }
                stage('Frontend Image') {
                    steps {
                        dir('frontend') {
                            sh '''
                                docker build --pull --no-cache \
                                    -t "$DOCKER_CREDS_USR/task-frontend:latest" .
                                docker push "$DOCKER_CREDS_USR/task-frontend:latest"
                            '''
                        }
                    }
                }
            }
        }

        stage('Deploy to Production Server') {
            steps {
                sshagent(['gcp-prod-server']) {
                    withCredentials([string(credentialsId: 'cloudsql-db-pass', variable: 'DB_PASS')]) {
                        sh '''
                            ssh -o StrictHostKeyChecking=no ${PROD_SERVER} '
                                echo "${DOCKER_CREDS_PSW}" | docker login -u "${DOCKER_CREDS_USR}" --password-stdin
                                docker pull ${DOCKER_CREDS_USR}/task-backend:latest
                                docker pull ${DOCKER_CREDS_USR}/task-frontend:latest
                                docker stop task-backend || true && docker rm task-backend || true
                                docker stop task-frontend || true && docker rm task-frontend || true
                                docker run -d --name task-backend -p 8080:8080 \
                                    -e SPRING_DATASOURCE_URL=jdbc:postgresql://${DB_HOST}:${DB_PORT}/${DB_NAME} \
                                    -e SPRING_DATASOURCE_USERNAME=${DB_USER} \
                                    -e SPRING_DATASOURCE_PASSWORD=${DB_PASS} \
                                    ${DOCKER_CREDS_USR}/task-backend:latest
                                docker run -d --name task-frontend -p 80:80 \
                                    ${DOCKER_CREDS_USR}/task-frontend:latest
                            '
                        '''
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
