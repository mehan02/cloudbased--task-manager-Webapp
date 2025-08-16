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

        stage('Deploy to Cloud Run') {
            steps {
                withCredentials([file(credentialsId: 'gcp-service-account', variable: 'GCP_KEY')]) {
                    script {
                        // Authenticate gcloud with the service account key
                        sh 'gcloud auth activate-service-account --key-file=$GCP_KEY'

                        // Deploy backend
                        sh """
                        gcloud run deploy taskmanager-backend-service \
                            --image docker.io/mehan02/my-backend:latest \
                            --region us-central1 \
                            --platform managed \
                            --allow-unauthenticated
                        """

                        // Deploy frontend
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
            echo 'Pipeline finished!'
        }
    }
}

