pipeline {
    agent any

    tools {
        nodejs "Node_20"
    }

    environment {
        // Secure credential binding (masked in logs)
        DB_CREDS = credentials('cloudsql-db-pass')   
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
                    sh 'npm ci --no-audit'  // More secure than install
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
                        // Using Jenkins' built-in docker plugin for better security
                        def backendEnvVars = [
                            "SPRING_DATASOURCE_URL=jdbc:mysql://${DB_HOST}:3306/${DB_NAME}",
                            "SPRING_DATASOURCE_USERNAME=${DB_CREDS_USR}",
                            "SPRING_DATASOURCE_PASSWORD=${DB_CREDS_PSW}"
                        ].join(',')

                        sshCommand(
                            remote: DEPLOY_SERVER,
                            command: """
                                docker stop my-frontend my-backend || true
                                docker rm my-frontend my-backend || true
                                docker run -d -p 80:80 --name my-frontend my-frontend
                                docker run -d -p 8080:8080 --name my-backend \\
                                    -e ${backendEnvVars} \\
                                    my-backend
                            """,
                            sudo: false
                        )
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
