pipeline {
    agent any

    stages {
        stage('Build Projects') {
            parallel {
                stage('backendBuild') {
                    steps {
                        dir('backend') {
                            sh './gradlew clean build --parallel --info'
                        }
                    }
                }
                stage('frontendBuild') {
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

        stage('Docker Build & Push') {
            parallel {
                stage('backendDocker') {
                    steps {
                        withCredentials([usernamePassword(
                            credentialsId: 'docker-hub-pass', 
                            usernameVariable: 'DOCKER_USER', 
                            passwordVariable: 'DOCKER_PASS'
                        )]) {
                            sh 'echo $DOCKER_PASS | docker login -u $DOCKER_USER --password-stdin'
                            sh 'docker build --pull --no-cache -t $DOCKER_USER/my-backend:latest ./backend'
                            sh 'docker push $DOCKER_USER/my-backend:latest'
                            sh 'docker logout'
                        }
                    }
                }
                stage('frontendDocker') {
                    steps {
                        withCredentials([usernamePassword(
                            credentialsId: 'docker-hub-pass', 
                            usernameVariable: 'DOCKER_USER', 
                            passwordVariable: 'DOCKER_PASS'
                        )]) {
                            sh 'echo $DOCKER_PASS | docker login -u $DOCKER_USER --password-stdin'
                            sh 'docker build --pull --no-cache -t $DOCKER_USER/my-frontend:latest ./frontend'
                            sh 'docker push $DOCKER_USER/my-frontend:latest'
                            sh 'docker logout'
                        }
                    }
                }
            }
        }
    }
}

