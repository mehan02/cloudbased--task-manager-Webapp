# Build stage
FROM gradle:7.6.0-jdk17 as build
WORKDIR /app
COPY . .
RUN chmod +x ./gradlew
RUN ./gradlew build -x test

# Production stage
# Use a modern JRE with cgroup v2 fixes to avoid ProcessorMetrics NPE
FROM eclipse-temurin:17-jre

# Sensible defaults for containers
ENV JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=75 -Djava.security.egd=file:/dev/./urandom"
COPY --from=build /app/build/libs/*-SNAPSHOT.jar app.jar
EXPOSE 8081
ENTRYPOINT ["java", "-jar", "app.jar"]

