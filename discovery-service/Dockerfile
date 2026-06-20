# ─────────────────────────────────────────────
# Stage 1 — Build the JAR using Maven
# ─────────────────────────────────────────────
FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

# ─────────────────────────────────────────────
# Stage 2 — Run only the JAR (slim image)
# ─────────────────────────────────────────────
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar

# Eureka runs on port 8761
EXPOSE 8761

ENTRYPOINT ["java", "-jar", "app.jar"]
