pipeline {
    agent any

    tools {
        nodejs 'Node_20'
        jdk 'Java17'
    }

    environment {
        PATH = "${env.JAVA_HOME}/bin:${env.NODEJS_HOME}/bin:${env.PATH}"
        DOCKER_BUILDKIT = "1"

        // Production server configuration
        PROD_SERVER = '34.14.197.81'
        PROD_USER = 'task-manager-server1'

        // Backend database credentials
        BACKEND_DB_USER = 'taskuser'
        BACKEND_DB_NAME = 'taskmanager'
        BACKEND_DB_PASS = credentials('cloudsql-db-pass') // Jenkins secret text
    }

    stages {
        stage('Checkout SCM') {
            steps {
                checkout scm
            }
        }

        stage('Verify Tools') {
            steps {
                sh """
                    echo "=== Tool Versions ==="
                    echo "Node: \$(node -v)"
                    echo "NPM: \$(npm -v)"
                    echo "Java: \$(java -version 2>&1 | head -n 1)"
                    echo "Gradle: \$(./backend/gradlew --version | grep 'Gradle')"
                    docker --version
                """
            }
        }

        stage('Install Frontend Dependencies') {
            steps {
                dir('frontend') {
                    sh 'npm ci'
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

        stage('Docker Build Frontend') {
            steps {
                dir('frontend') {
                    sh '''
                        for i in {1..3}; do
                            docker build -t my-frontend . && break
                            sleep 10
                        done
                    '''
                }
            }
        }

        stage('Docker Build Backend') {
            steps {
                dir('backend') {
                    sh '''
                        for i in {1..3}; do
                            docker build -t my-backend . && break
                            sleep 10
                        done
                    '''
                }
            }
        }

        stage('Deploy to Production') {
            steps {
                script {
                    def remote = [:]
                    remote.name = 'prod-server'
                    remote.host = env.PROD_SERVER
                    remote.user = env.PROD_USER
                    remote.allowAnyHosts = true

                    sshCommand remote: remote, command: """
                        # Stop and remove previous containers if they exist
                        docker stop my-frontend || true
                        docker rm my-frontend || true
                        docker stop my-backend || true
                        docker rm my-backend || true

                        # Run backend with DB environment variables
                        docker run -d --name my-backend \\
                            -e DB_USER=${BACKEND_DB_USER} \\
                            -e DB_NAME=${BACKEND_DB_NAME} \\
                            -e DB_PASS=${BACKEND_DB_PASS} \\
                            -p 8080:8080 my-backend

                        # Run frontend
                        docker run -d --name my-frontend \\
                            -p 80:80 my-frontend
                    """
                }
            }
        }
    }

    post {
        always {
            cleanWs()
        }
        failure {
            slackSend channel: '#builds',
                      message: "Build Failed: ${env.JOB_NAME} #${env.BUILD_NUMBER}"
        }
    }
}

