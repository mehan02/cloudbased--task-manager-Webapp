pipeline {
    agent any

    tools {
        nodejs "Node_20"
    }

    environment {
     
        DB_CREDS = credentials('db-username-password-creds')  
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
                        // Using the credential variables directly
                        sshCommand(
                            remote: DEPLOY_SERVER,
                            command: """
                                docker stop my-frontend my-backend || true
                                docker rm my-frontend my-backend || true
                                docker run -d -p 80:80 --name my-frontend my-frontend
                                docker run -d -p 8080:8080 --name my-backend \\
                                    -e SPRING_DATASOURCE_URL=jdbc:mysql://${DB_HOST}:3306/${DB_NAME} \\
                                    -e SPRING_DATASOURCE_USERNAME=${DB_CREDS_USR} \\
                                    -e SPRING_DATASOURCE_PASSWORD=${DB_CREDS_PSW} \\
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
      
            mail to: 'samarajeewams02@gmail.com',
                 subject: "Pipeline Failed: ${env.JOB_NAME} #${env.BUILD_NUMBER}",
                 body: "Check the failed build at ${env.BUILD_URL}"
        }
    }
}
