FROM gradle:7.6.0-jdk17 as build
WORKDIR /app
COPY . .
RUN chmod +x ./gradlew
RUN ./gradlew build -x test

FROM openjdk:17
COPY --from=build /app/build/libs/*-SNAPSHOT.jar app.jar
EXPOSE 8081
ENTRYPOINT ["java", "-jar", "app.jar"]
