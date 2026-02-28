package com.example.api_gateway;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class ApiGatewayApplication {

        public static void main(String[] args) {
                SpringApplication.run(ApiGatewayApplication.class, args);
        }

        @Bean
        public RouteLocator customRoutes(RouteLocatorBuilder builder) {
                final String productUrl = System.getenv("PRODUCT_URL") != null ? System.getenv("PRODUCT_URL")
                                : "http://localhost:8082";
                final String cartUrl = System.getenv("CART_URL") != null ? System.getenv("CART_URL")
                                : "http://localhost:8083";
                final String orderUrl = System.getenv("ORDER_URL") != null ? System.getenv("ORDER_URL")
                                : "http://localhost:8084";

                return builder.routes()
                                .route("product-service", r -> r.path("/products/**")
                                                .uri(productUrl))
                                .route("cart-service", r -> r.path("/cart/**")
                                                .uri(cartUrl))
                                .route("order-service", r -> r.path("/orders/**")
                                                .uri(orderUrl))
                                .build();
        }
}
