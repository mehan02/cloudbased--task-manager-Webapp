pipeline {
    agent any

    environment {
        PATH = "${tool name: 'Node_20', type: 'NodeJS'}/bin:${env.PATH}"
    }

    stages {
        stage('Checkout SCM') {
            steps {
                checkout([$class: 'GitSCM',
                    branches: [[name: '*/main']],
                    userRemoteConfigs: [[url: 'https://github.com/mehan02/cloudbased--task-manager-.git', credentialsId: 'github-pat']]
                ])
            }
        }

        stage('Verify Tools') {
            steps {
                sh '''
                    echo === Versions ===
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
                dir('frontend') {
                    sh 'DOCKER_BUILDKIT=0 docker build -t my-frontend .'
                }
                dir('backend') {
                    sh 'DOCKER_BUILDKIT=0 docker build -t my-backend .'
                }
            }
        }

        stage('Deploy') {
            steps {
                withCredentials([string(credentialsId: 'cloudsql-db-pass', variable: 'DB_PASSWORD')]) {
                    sh '''
                        docker rm -f frontend backend || true
                        docker run -d -p 80:80 --name frontend my-frontend
                        docker run -d -p 8081:8081 --name backend -e DB_PASSWORD=$DB_PASSWORD my-backend
                    '''
                }
            }
        }
    }

    post {
        always {
            node {
                cleanWs()
            }
        }
    }
}

