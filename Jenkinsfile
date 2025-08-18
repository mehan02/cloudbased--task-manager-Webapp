pipeline {
    agent any

    tools {
        nodejs "Node_20"
    }

    environment {
        // Use usernamePassword credential type
        DB_CREDS = credentials('cloudsql-db-pass')  // Must be usernamePassword type in Jenkins
        DB_HOST = '34.14.211.97'                    
        DB_NAME = 'taskmanager'          
        DEPLOY_SERVER = '34.14.197.81'                
    }

    stages {
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

        stage('Build Frontend') {
            steps {
                dir('frontend') {
                    sh 'npm ci --no-audit'
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
                script {
                    docker.build("my-frontend", "./frontend")
                    docker.build("my-backend", "./backend")
                    sh 'docker image prune -f --filter "until=24h"'
                }
            }
        }

        stage('Secure Deploy') {
            steps {
                sshagent(credentials: ['gcp-prod-server']) {
                    script {
                        // Using withCredentials for additional security
                        withCredentials([usernamePassword(
                            credentialsId: 'cloudsql-db-pass',
                            usernameVariable: 'DB_USER',
                            passwordVariable: 'DB_PASSWORD'
                        )]) {
                            sshCommand(
                                remote: DEPLOY_SERVER,
                                command: """
                                    docker stop my-frontend my-backend || true
                                    docker rm my-frontend my-backend || true
                                    docker run -d -p 80:80 --name my-frontend my-frontend
                                    docker run -d -p 8080:8080 --name my-backend \\
                                        -e SPRING_DATASOURCE_URL=jdbc:mysql://${DB_HOST}:3306/${DB_NAME} \\
                                        -e SPRING_DATASOURCE_USERNAME=${DB_USER} \\
                                        -e SPRING_DATASOURCE_PASSWORD=${DB_PASSWORD} \\
                                        my-backend
                                """,
                                sudo: false
                            )
                        }
                    }
                }
            }
        }
    }

    post {
        always {
            cleanWs()
            script {
                dockerLogout()
            }
        }
        failure {
            slackSend channel: '#deployments',
                     message: "Deployment failed: ${env.JOB_NAME} ${env.BUILD_NUMBER}"
        }
    }
}
