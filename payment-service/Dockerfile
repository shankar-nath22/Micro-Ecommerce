# Build stage
FROM golang:1.24-alpine AS build
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN go build -o main .

# Run stage
FROM alpine:latest
WORKDIR /app
COPY --from=build /app/main .
EXPOSE 8085
CMD ["./main"]
