pipeline {
    agent any

    tools {
        jdk 'jdk17'
        gradle 'gradle7'
        nodejs 'Node_18'   // Make sure this exists in Jenkins "Global Tool Configuration"
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
    }

    post {
        always {
            echo 'Pipeline finished!'
        }
    }
}
