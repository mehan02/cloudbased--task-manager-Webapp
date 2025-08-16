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
                    credentialsId: 'github-credentials',  // Make sure this exists
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
                    // Use NodeJS wrapper provided by Jenkins
                    nodejs(nodeJSInstallationName: 'Node_18') {
                        sh 'npm install'
                        sh 'npm run build'
                    }
                }
            }
        }

        stage('Deploy to Cloud Run') {
            steps {
                script {
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

    post {
        always {
            echo 'Pipeline finished!'
        }
    }

}
