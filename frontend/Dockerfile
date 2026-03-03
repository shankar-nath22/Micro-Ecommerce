# Step 1: Build the Vite production bundle
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Step 2: Serve using NGINX
FROM nginx:alpine
# Copy the built assets we made in builder step
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose Nginx Port
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
