pipeline {
    agent any

    tools {
        jdk 'jdk17'
        gradle 'gradle7'
        nodejs 'Node_20'
    }

    environment {
        DOCKER_USER = 'mehan02'
    }

    stages {
        stage('Clean Workspace') {
            steps {
                deleteDir()
            }
        }

        stage('Checkout Code') {
            steps {
                git branch: 'main',
                    credentialsId: 'github-token',
                    url: 'https://github.com/mehan02/cloudbased--task-manager-.git'
            }
        }

        stage('Restore Caches') {
            steps {
                script {
                    if (fileExists('backend/.gradle-cache.tar')) {
                        sh 'tar -xf backend/.gradle-cache.tar -C backend/'
                    }
                    if (fileExists('frontend/node_modules-cache.tar')) {
                        sh 'tar -xf frontend/node_modules-cache.tar -C frontend/'
                    }
                }
            }
        }

        stage('Build Projects') {
            parallel {
                stage('Build Backend') {
                    steps {
                        dir('backend') {
                            sh './gradlew clean build --parallel --info'
                        }
                    }
                }
                stage('Build Frontend') {
                    steps {
                        dir('frontend') {
                            nodejs(nodeJSInstallationName: 'Node_20') {
                                sh 'npm ci'
                                sh 'npm run build'
                            }
                        }
                    }
                }
            }
        }

        stage('Save Caches') {
            steps {
                script {
                    sh 'tar -cf backend/.gradle-cache.tar -C backend .gradle || true'
                    sh 'tar -cf frontend/node_modules-cache.tar -C frontend node_modules || true'
                }
            }
        }

        stage('Docker Build & Push') {
            parallel {
                stage('Backend Docker') {
                    steps {
                        withCredentials([string(credentialsId: 'docker-hub-pass', variable: 'DOCKER_PASS')]) {
                            script {
                                sh 'echo $DOCKER_PASS | docker login -u $DOCKER_USER --password-stdin'
                                sh '''
                                docker build --pull -t $DOCKER_USER/my-backend:latest ./backend
                                docker push $DOCKER_USER/my-backend:latest
                                '''
                                sh 'docker logout'
                            }
                        }
                    }
                }
                stage('Frontend Docker') {
                    steps {
                        withCredentials([string(credentialsId: 'docker-hub-pass', variable: 'DOCKER_PASS')]) {
                            script {
                                sh 'echo $DOCKER_PASS | docker login -u $DOCKER_USER --password-stdin'
                                sh '''
                                docker build --pull -t $DOCKER_USER/my-frontend:latest ./frontend
                                docker push $DOCKER_USER/my-frontend:latest
                                '''
                                sh 'docker logout'
                            }
                        }
                    }
                }
            }
        }

        stage('Deploy to Cloud Run') {
            steps {
                withCredentials([file(credentialsId: 'gcp-service-account', variable: 'GCP_KEY')]) {
                    script {
                        sh 'gcloud auth activate-service-account --key-file=$GCP_KEY'
                        sh 'gcloud config set project taskmanager-mehan'

                        sh '''
                        gcloud run deploy taskmanager-backend-service \
                            --image docker.io/$DOCKER_USER/my-backend:latest \
                            --region us-central1 \
                            --platform managed \
                            --allow-unauthenticated
                        '''
                        sh '''
                        gcloud run deploy taskmanager-frontend-service \
                            --image docker.io/$DOCKER_USER/my-frontend:latest \
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
