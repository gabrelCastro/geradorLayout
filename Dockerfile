# --- Etapa 1: build ---
FROM maven:3.8-eclipse-temurin-21-alpine AS builder

WORKDIR /app

COPY pom.xml .

# baixa dependências antes de copiar o código (cache de camadas)
RUN mvn dependency:resolve -q 2>/dev/null || true

COPY src/ src/

RUN mvn package -DskipTests -q

# --- Etapa 2: runtime ---
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

# usuário não-root por padrão
RUN addgroup -S app && adduser -S app -G app
USER app

COPY --from=builder /app/target/layout-generator-1.0.0.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]