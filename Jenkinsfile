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
                    credentialsId: 'github-token', // Update with your Jenkins GitHub token ID
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
                        sh 'echo $DOCKER_PASS | docker login -u mehan02 --password-stdin'

                        // Backend image
                        sh '''
                        docker build -t mehan02/my-backend:latest ./backend
                        docker push mehan02/my-backend:latest
                        '''

                        // Frontend image
                        sh '''
                        docker build -t mehan02/my-frontend:latest ./frontend
                        docker push mehan02/my-frontend:latest
                        '''
                    }
                }
            }
        }

        stage('Deploy to Cloud Run') {
            steps {
                script {
                    // Check if gcloud is installed
                    sh 'which gcloud || (echo "gcloud CLI not found!" && exit 1)'

                    withCredentials([file(credentialsId: 'gcp-service-account', variable: 'GCP_KEY')]) {
                        // Authenticate
                        sh 'gcloud auth activate-service-account --key-file=$GCP_KEY'

                        // Set GCP project  
                        sh 'gcloud config set project taskmanager-mehan'

                        // Deploy backend
                        sh '''
                        gcloud run deploy taskmanager-backend-service \
                            --image docker.io/mehan02/my-backend:latest \
                            --region us-central1 \
                            --platform managed \
                            --allow-unauthenticated
                        '''

                        // Deploy frontend
                        sh '''
                        gcloud run deploy taskmanager-frontend-service \
                            --image docker.io/mehan02/my-frontend:latest \
                            --region us-central1 \
                            --platform managed \
                            --allow-unauthenticated
                        '''
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
