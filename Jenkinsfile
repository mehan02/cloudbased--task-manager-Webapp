pipeline {
    agent any

    tools {
        nodejs "Node_20"
    }

    environment {
        DB_HOST = '34.14.211.97'
        DB_NAME = 'taskmanager'
        DEPLOY_SERVER = '34.14.197.81'
    }

    stages {
        stage('Checkout') {
            steps {
                git branch: 'main',
                    url: 'https://github.com/mehan02/cloudbased--task-manager-.git',
                    credentialsId: 'github-pat'
            }
        }

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
                script {
                    docker.build("my-frontend", "./frontend")
                    docker.build("my-backend", "./backend")
                    sh 'docker image prune -f --filter "until=24h"'
                }
            }
        }

        stage('Deploy') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'cloudsql-db-pass', usernameVariable: 'DB_USER', passwordVariable: 'DB_PASS')]) {
                    sshagent(['gcp-prod-server']) {
                        sh """
                            docker stop my-frontend my-backend || true
                            docker rm my-frontend my-backend || true
                            docker run -d -p 80:80 --name my-frontend my-frontend
                            docker run -d -p 8080:8080 --name my-backend \\
                                -e SPRING_DATASOURCE_URL=jdbc:mysql://${DB_HOST}:3306/${DB_NAME} \\
                                -e SPRING_DATASOURCE_USERNAME=${DB_USER} \\
                                -e SPRING_DATASOURCE_PASSWORD=${DB_PASS} \\
                                my-backend
                        """
                    }
                }
            }
        }
    }

    post {
        always { cleanWs() }
        failure {
            mail to: 'samarajeewams02@gmail.com',
                 subject: "FAILED: ${env.JOB_NAME} #${env.BUILD_NUMBER}",
                 body: "Build failed: ${currentBuild.currentResult}\n${env.BUILD_URL}"
        }
        success { echo "Build succeeded! ${env.BUILD_URL}" }
    }
}

