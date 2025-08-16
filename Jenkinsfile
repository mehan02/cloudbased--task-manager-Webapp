stage('Build Projects') {
    parallel {
        backendBuild: {
            steps {
                dir('backend') {
                    sh './gradlew clean build --parallel --info'
                }
            }
        }
        frontendBuild: {
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
        backendDocker: {
            steps {
                withCredentials([usernamePassword(credentialsId: 'docker-hub-pass', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                    sh 'echo $DOCKER_PASS | docker login -u $DOCKER_USER --password-stdin'
                    sh 'docker build --pull --no-cache -t $DOCKER_USER/my-backend:latest ./backend'
                    sh 'docker push $DOCKER_USER/my-backend:latest'
                    sh 'docker logout'
                }
            }
        }
        frontendDocker: {
            steps {
                withCredentials([string(credentialsId: 'docker-hub-pass', variable: 'DOCKER_PASS')]) {
                    sh 'echo $DOCKER_PASS | docker login -u $DOCKER_USER --password-stdin'
                    sh '''
                    docker build --pull --no-cache -t $DOCKER_USER/my-frontend:latest ./frontend
                    docker push $DOCKER_USER/my-frontend:latest
                    '''
                    sh 'docker logout'
                }
            }
        }
    }
}

