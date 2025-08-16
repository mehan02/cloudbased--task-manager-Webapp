pipeline {
    agent any

    tools {
        jdk 'jdk17'
        gradle 'gradle7'
        nodejs 'Node_18'    
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
                        //  Login to Docker Hub
                        sh('echo $DOCKER_PASS | docker login -u mehan02 --password-stdin')

                        // Build & Push Backend Image
                        sh """
                        docker build -t mehan02/my-backend:latest ./backend
                        docker push mehan02/my-backend:latest
                        """

                        // Build & Push Frontend Image
                        sh """
                        docker build -t mehan02/my-frontend:latest ./frontend
                        docker push mehan02/my-frontend:latest
                        """
                    }
                }
            }
        }

        stage('Deploy to Cloud Run') {
            steps {
                withCredentials([file(credentialsId: 'gcp-service-account', variable: 'GCP_KEY')]) {
                    script {
                        //  Authenticate gcloud with the service account key
                        sh 'gcloud auth activate-service-account --key-file=$GCP_KEY'

                        // Deploy Backend to Cloud Run
                        sh """
                        gcloud run deploy taskmanager-backend-service \
                            --image docker.io/mehan02/my-backend:latest \
                            --region us-central1 \
                            --platform managed \
                            --allow-unauthenticated
                        """

                        // Deploy Frontend to Cloud Run
                        sh """
                        gcloud run deploy taskmanager-frontend-service \
                            --image docker.io/mehan02/my-frontend:latest \
                            --region us-central1 \
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
            echo ' Pipeline finished!'
        }
    }
}
