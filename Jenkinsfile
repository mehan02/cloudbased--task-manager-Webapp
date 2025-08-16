pipeline {
    agent any

    tools {
        jdk 'jdk17'
        gradle 'gradle7'
        nodejs 'Node_18'
    }

    environment {
        DOCKER_USER = 'mehan02'
        GCP_PROJECT = 'YOUR_GCP_PROJECT_ID'  // Replace with your GCP project ID
        CLOUD_RUN_REGION = 'us-central1'
    }

    stages {
        stage('Checkout Code') {
            steps {
                git branch: 'main',
                    credentialsId: 'github-credentials',
                    url: 'https://github.com/mehan02/cloudbased--task-manager-.git'
            }
        }

        stage('Build Backend') {
            steps {
                dir('backend') {
                    sh './gradlew clean build'
                }
            }
        }

        stage('Build Frontend') {
            steps {
                dir('frontend') {
                    nodejs(nodeJSInstallationName: 'Node_18') {
                        sh 'npm install'
                        sh 'npm run build'
                    }
                }
            }
        }

        stage('Build & Push Docker Images') {
            steps {
                withCredentials([string(credentialsId: 'docker-hub-pass', variable: 'DOCKER_PASS')]) {
                    script {
                        // Docker login
                        sh 'echo $DOCKER_PASS | docker login -u $DOCKER_USER --password-stdin'

                        // Backend Docker build & push
                        sh """
                        docker build -t $DOCKER_USER/my-backend:latest ./backend
                        docker push $DOCKER_USER/my-backend:latest
                        """

                        // Frontend Docker build & push
                        sh """
                        docker build -t $DOCKER_USER/my-frontend:latest ./frontend
                        docker push $DOCKER_USER/my-frontend:latest
                        """
                    }
                }
            }
        }

        stage('Deploy to Cloud Run') {
            steps {
                withCredentials([file(credentialsId: 'gcp-service-account', variable: 'GCP_KEY')]) {
                    script {
                        // Authenticate gcloud
                        sh 'gcloud auth activate-service-account --key-file=$GCP_KEY'
                        sh 'gcloud config set project $GCP_PROJECT'

                        // Deploy backend
                        sh """
                        gcloud run deploy taskmanager-backend-service \
                            --image docker.io/$DOCKER_USER/my-backend:latest \
                            --region $CLOUD_RUN_REGION \
                            --platform managed \
                            --allow-unauthenticated
                        """

                        // Deploy frontend
                        sh """
                        gcloud run deploy taskmanager-frontend-service \
                            --image docker.io/$DOCKER_USER/my-frontend:latest \
                            --region $CLOUD_RUN_REGION \
                            --platform managed \
                            --allow-unauthenticated
                        """
                    }
                }
            }
        }
    }

    post {
        always {
            echo 'Pipeline finished!'
        }
    }
}
