pipeline {
    agent any

    environment {
        REMOTE_USER        = "samarajeewamehan"
        REMOTE_HOST       = "34.14.197.81"
        BACKEND_DB_PASS   = credentials('cloudsql-db-pass')
        DB_NAME           = "taskdb"
        DB_USER           = "taskuser"
        DB_HOST           = "34.93.xx.xx"  // Cloud SQL public IP
        SSH_KEY           = "/var/lib/jenkins/.ssh/gcp-task-manager.pem"
        BACKEND_DIR       = "/home/${REMOTE_USER}/backend"
        FRONTEND_DIR      = "/home/${REMOTE_USER}/frontend"
    }

    stages {
        stage('Build Backend') {
            steps {
                dir('backend') {
                    sh './gradlew clean build -x test'
                }
            }
        }

        stage('Build Frontend') {
            steps {
                dir('frontend') {
                    sh 'npm install'
                    sh 'npm run build'
                }
            }
        }

        stage('Deploy to Remote') {
            steps {
                sshDeployBackend()
                sshDeployFrontend()
            }
        }
    }
}

// Custom functions for better modularity
def sshDeployBackend() {
    def dockerfile = '''
        FROM openjdk:17-jdk-slim
        COPY backend.jar app.jar
        ENTRYPOINT ["java", "-jar", "/app.jar"]
    '''.stripIndent()

    sh """
        echo "=== Deploying Backend ==="
        scp -i ${SSH_KEY} -o StrictHostKeyChecking=no \
            backend/build/libs/*.jar \
            ${REMOTE_USER}@${REMOTE_HOST}:${BACKEND_DIR}/backend.jar

        ssh -i ${SSH_KEY} -o StrictHostKeyChecking=no ${REMOTE_USER}@${REMOTE_HOST} << EOF
            mkdir -p ${BACKEND_DIR}
            cd ${BACKEND_DIR}
            echo '${dockerfile}' > Dockerfile
            docker build -t my-backend .
            docker stop my-backend || true
            docker rm my-backend || true
            docker run -d --name my-backend -p 8080:8080 \\
                -e SPRING_DATASOURCE_URL="jdbc:mysql://${DB_HOST}:3306/${DB_NAME}" \\
                -e SPRING_DATASOURCE_USERNAME="${DB_USER}" \\
                -e SPRING_DATASOURCE_PASSWORD="${BACKEND_DB_PASS}" \\
                my-backend
        EOF
    """
}

def sshDeployFrontend() {
    def dockerfile = '''
        FROM nginx:alpine
        COPY . /usr/share/nginx/html
        EXPOSE 80
        CMD ["nginx", "-g", "daemon off;"]
    '''.stripIndent()

    sh """
        echo "=== Deploying Frontend ==="
        scp -i ${SSH_KEY} -o StrictHostKeyChecking=no \
            -r frontend/build/* \
            ${REMOTE_USER}@${REMOTE_HOST}:${FRONTEND_DIR}/

        ssh -i ${SSH_KEY} -o StrictHostKeyChecking=no ${REMOTE_USER}@${REMOTE_HOST} << EOF
            mkdir -p ${FRONTEND_DIR}
            cd ${FRONTEND_DIR}
            echo '${dockerfile}' > Dockerfile
            docker build -t my-frontend .
            docker stop my-frontend || true
            docker rm my-frontend || true
            docker run -d --name my-frontend -p 80:80 my-frontend
        EOF
    """
}
