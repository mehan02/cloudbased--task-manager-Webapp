pipeline {
    agent any

    environment {
        // DB Configuration
        DB_HOST = '34.14.211.97'         
        DB_NAME = 'taskmanager'          
        DB_USER = 'taskuser'             
        DB_PASSWORD = credentials('cloudsql-db-pass')  
    }

    stages {
        stage('Checkout') {
            steps {
                git branch: 'main',
                    url: 'git@github.com:MehanSamarajeewa/task-manager.git'
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

        stage('Build Docker Images') {
            steps {
                script {
                    sh 'docker build -t taskmanager-backend ./backend'
                    sh 'docker build -t taskmanager-frontend ./frontend'
                }
            }
        }

        stage('Push Docker Images') {
            steps {
                script {
                    sh 'docker tag taskmanager-backend gcr.io/YOUR_PROJECT_ID/taskmanager-backend:latest'
                    sh 'docker tag taskmanager-frontend gcr.io/YOUR_PROJECT_ID/taskmanager-frontend:latest'
                    
                    sh 'docker push gcr.io/YOUR_PROJECT_ID/taskmanager-backend:latest'
                    sh 'docker push gcr.io/YOUR_PROJECT_ID/taskmanager-frontend:latest'
                }
            }
        }

        stage('Deploy') {
            steps {
                script {
                    // Stop old containers
                    sh '''
                        ssh -o StrictHostKeyChecking=no mehan@34.14.197.81 "
                            docker stop taskmanager-backend || true &&
                            docker rm taskmanager-backend || true &&
                            docker stop taskmanager-frontend || true &&
                            docker rm taskmanager-frontend || true
                        "
                    '''

                    // Run backend with DB connection
                    sh """
                        ssh -o StrictHostKeyChecking=no mehan@34.14.197.81 '
                            docker run -d --name taskmanager-backend -p 8080:8080 \
                            -e SPRING_DATASOURCE_URL=jdbc:mysql://${DB_HOST}:3306/${DB_NAME} \
                            -e SPRING_DATASOURCE_USERNAME=${DB_USER} \
                            -e SPRING_DATASOURCE_PASSWORD=${DB_PASSWORD} \
                            gcr.io/YOUR_PROJECT_ID/taskmanager-backend:latest
                        '
                    """

                    // Run frontend
                    sh """
                        ssh -o StrictHostKeyChecking=no mehan@34.14.197.81 '
                            docker run -d --name taskmanager-frontend -p 80:80 \
                            gcr.io/YOUR_PROJECT_ID/taskmanager-frontend:latest
                        '
                    """
                }
            }
        }
    }
}
