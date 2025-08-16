pipeline {
    agent any

    tools {
        jdk 'jdk17'
        gradle 'gradle7'
        nodejs 'Node_18'
    }

    environment {
        BACKEND_IMAGE = "docker.io/mehan02/my-backend:latest"
        FRONTEND_IMAGE = "docker.io/mehan02/my-frontend:latest"
        GCP_PROJECT = "taskmanager-mehan"  
        REGION = "us-central1"
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
                withCredentials([usernamePassword(credentialsId: 'dockerhub-credentials',
                                                  usernameVariable: 'DOCKER_USER',
                                                  passwordVariable: 'DOCKER_PASS')]) {
                    sh """
                    echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin

                    # Build & push backend
                    docker build -t $BACKEND_IMAGE ./backend
                    docker push $BACKEND_IMAGE

                    # Build & push frontend
                    docker build -t $FRONTEND_IMAGE ./frontend
                    docker push $FRONTEND_IMAGE
                    """
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
                            --image $BACKEND_IMAGE \
                            --region $REGION \
                            --platform managed \
                            --allow-unauthenticated
                        """

                        // Deploy frontend
                        sh """
                        gcloud run deploy taskmanager-frontend-service \
                            --image $FRONTEND_IMAGE \
                            --region $REGION \
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

