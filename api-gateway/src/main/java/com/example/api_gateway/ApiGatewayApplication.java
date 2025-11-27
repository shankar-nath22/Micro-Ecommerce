package com.example.api_gateway;

import com.example.api_gateway.security.JwtGatewayFilter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class ApiGatewayApplication {

    @Autowired
    private JwtGatewayFilter jwtFilter;

    public static void main(String[] args) {
        SpringApplication.run(ApiGatewayApplication.class, args);
    }

    @Bean
    public RouteLocator customRoutes(RouteLocatorBuilder builder) {
    return builder.routes()
            .route("product-service", r -> r.path("/products/**")
                    .uri("http://localhost:8082"))
            .route("cart-service", r -> r.path("/cart/**")
                    .uri("http://localhost:8083"))
            .route("order-service", r -> r.path("/orders/**")
                    .uri("http://localhost:8084"))
            .build();
    }
}
