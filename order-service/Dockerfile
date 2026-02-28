# Build stage
FROM golang:1.24-alpine AS build 
# Note: Using 1.24 for now as 1.25.4 isn't publicly available on Docker Hub yet, 
# but it should be compatible.
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN go build -o main .

# Run stage
FROM alpine:latest
WORKDIR /app
COPY --from=build /app/main .
EXPOSE 8084
CMD ["./main"]
