pipeline {
    agent any

    environment {
        REMOTE_USER = "samarajeewamehan"
        REMOTE_HOST = "34.14.197.81"
        BACKEND_DB_PASS = credentials('cloudsql-db-pass')
        DB_NAME = "taskdb"
        DB_USER = "taskuser"
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
                sh '''
                    echo "=== Cleaning up old containers on remote ==="
                    ssh -i /var/lib/jenkins/.ssh/gcp-task-manager.pem -o StrictHostKeyChecking=no ${REMOTE_USER}@${REMOTE_HOST} "
                        docker stop my-db || true
                        docker rm my-db || true
                        docker rmi my-db || true
                        docker stop my-backend || true
                        docker rm my-backend || true
                        docker rmi my-backend || true
                        docker stop my-frontend || true
                        docker rm my-frontend || true
                        docker rmi my-frontend || true
                        mkdir -p /home/${REMOTE_USER}/frontend
                        mkdir -p /home/${REMOTE_USER}/backend
                        mkdir -p /home/${REMOTE_USER}/db
                    "

                    echo "=== Copying artifacts to remote ==="
                    scp -i /var/lib/jenkins/.ssh/gcp-task-manager.pem -o StrictHostKeyChecking=no backend/build/libs/*.jar ${REMOTE_USER}@${REMOTE_HOST}:/home/${REMOTE_USER}/backend/backend.jar
                    scp -i /var/lib/jenkins/.ssh/gcp-task-manager.pem -o StrictHostKeyChecking=no -r frontend/build/* ${REMOTE_USER}@${REMOTE_HOST}:/home/${REMOTE_USER}/frontend/
                    scp -i /var/lib/jenkins/.ssh/gcp-task-manager.pem -o StrictHostKeyChecking=no db/schema.sql ${REMOTE_USER}@${REMOTE_HOST}:/home/${REMOTE_USER}/db/

                    echo "=== Starting new containers on remote ==="
                    ssh -i /var/lib/jenkins/.ssh/gcp-task-manager.pem -o StrictHostKeyChecking=no ${REMOTE_USER}@${REMOTE_HOST} "
                        echo '=== Starting Database ==='
                        docker run -d --name my-db -e MYSQL_ROOT_PASSWORD=${BACKEND_DB_PASS} -e MYSQL_DATABASE=${DB_NAME} -e MYSQL_USER=${DB_USER} -e MYSQL_PASSWORD=${BACKEND_DB_PASS} -v /home/${REMOTE_USER}/db/schema.sql:/docker-entrypoint-initdb.d/schema.sql -p 3306:3306 mysql:8

                        echo '=== Building and Running Backend ==='
                        cd /home/${REMOTE_USER}/backend
                        echo 'FROM openjdk:17-jdk-slim
COPY backend.jar app.jar
ENTRYPOINT [\"java\",\"-jar\",\"/app.jar\"]' > Dockerfile
                        docker build -t my-backend .
                        docker run -d --name my-backend -p 8080:8080 --link my-db:mysql -e SPRING_DATASOURCE_URL=jdbc:mysql://my-db:3306/${DB_NAME} -e SPRING_DATASOURCE_USERNAME=${DB_USER} -e SPRING_DATASOURCE_PASSWORD=${BACKEND_DB_PASS} my-backend

                        echo '=== Building and Running Frontend ==='
                        cd /home/${REMOTE_USER}/frontend
                        echo 'FROM nginx:alpine
COPY . /usr/share/nginx/html
EXPOSE 80
CMD [\"nginx\",\"-g\",\"daemon off;\"]' > Dockerfile
                        docker build -t my-frontend .
                        docker run -d --name my-frontend -p 80:80 my-frontend
                    "
                '''
            }
        }
    }
}

