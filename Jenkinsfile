pipeline {
    agent any

    environment {
        DOCKERHUB_USER = "mehan02"   // 🔹 your DockerHub username
    }

    stages {
        stage('Checkout Code') {
            steps {
                git branch: 'main', url: 'https://github.com/YOUR-USERNAME/YOUR-REPO.git'
            }
        }

        stage('Build Backend Image') {
            steps {
                sh '''
                cd backend
                docker build -t $DOCKERHUB_USER/taskmanager-backend:latest .
                docker push $DOCKERHUB_USER/taskmanager-backend:latest
                '''
            }
        }

        stage('Build Frontend Image') {
            steps {
                sh '''
                cd frontend
                docker build -t $DOCKERHUB_USER/taskmanager-frontend:latest .
                docker push $DOCKERHUB_USER/taskmanager-frontend:latest
                '''
            }
        }

        stage('Deploy Containers') {
            steps {
                sh '''
                docker stop taskmanager-backend || true
                docker rm taskmanager-backend || true
                docker stop taskmanager-frontend || true
                docker rm taskmanager-frontend || true

                docker run -d --name taskmanager-backend -p 8080:8080 $DOCKERHUB_USER/taskmanager-backend:latest
                docker run -d --name taskmanager-frontend -p 3000:80 $DOCKERHUB_USER/taskmanager-frontend:latest
                '''
            }
        }
    }
}

