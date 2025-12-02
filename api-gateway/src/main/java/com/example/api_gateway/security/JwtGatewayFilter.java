package com.example.api_gateway.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import javax.crypto.SecretKey;

@Component
public class JwtGatewayFilter implements GlobalFilter, Ordered {

    @Value("${jwt.secret}")
    private String secret;

    @Override
    public int getOrder() {
        return -1; // Run early in the filter chain
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange,
                             org.springframework.cloud.gateway.filter.GatewayFilterChain chain) {

        String path = exchange.getRequest().getPath().value();
        System.out.println("🔥 Filter triggered for: " + path);

        // ✨ Skip JWT validation for /auth/**
        if (path.startsWith("/auth")) {
            System.out.println("⏭ Skipping JWT check for auth routes");
            return chain.filter(exchange);
        }

        // Read Authorization header
        String authHeader = exchange.getRequest().getHeaders().getFirst(HttpHeaders.AUTHORIZATION);

        // No token = reject
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            System.out.println("❌ Missing Bearer token");
            exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
            return exchange.getResponse().setComplete();
        }

        String token = authHeader.substring(7);

        try {
            SecretKey key = Keys.hmacShaKeyFor(secret.getBytes());

            Claims claims = Jwts.parserBuilder()
                    .setSigningKey(key)
                    .build()
                    .parseClaimsJws(token)
                    .getBody();

            System.out.println("✅ JWT validated for user: " + claims.getSubject());
            // 🔥 Forward token to downstream services
            ServerWebExchange modifiedExchange = exchange.mutate()
                .request(builder -> builder.header(HttpHeaders.AUTHORIZATION, authHeader))
                .build();
            return chain.filter(modifiedExchange);

        } catch (Exception e) {
            System.out.println("❌ JWT validation failed: " + e.getMessage());
            exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
            return exchange.getResponse().setComplete();
        }
    }
}
