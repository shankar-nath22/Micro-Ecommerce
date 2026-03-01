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
import java.nio.charset.StandardCharsets;

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
        String method = exchange.getRequest().getMethod().name();

        // Skip JWT validation for public routes and OPTIONS preflights
        boolean isPublicPath = "OPTIONS".equalsIgnoreCase(method)
                || path.startsWith("/auth")
                || (path.startsWith("/products") && "GET".equalsIgnoreCase(method))
                || (path.startsWith("/inventory/stock") && "GET".equalsIgnoreCase(method));

        if (isPublicPath) {
            System.out.println("⏭ Skipping JWT check for public routes: " + path);
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
            // SecretKey key = Keys.hmacShaKeyFor(secret.getBytes());
            SecretKey key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));

            Claims claims = Jwts.parserBuilder()
                    .setSigningKey(key)
                    .build()
                    .parseClaimsJws(token)
                    .getBody();

            System.out.println("✅ JWT validated for user: " + claims.getSubject());

            String email = claims.getSubject();
            String userId = claims.get("userId").toString(); // make sure token contains this
            String role = claims.get("role", String.class);

            if (userId == null) {
                System.out.println("❌ JWT missing userId");
                exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
                return exchange.getResponse().setComplete();
            }

            System.out.println("✅ JWT Valid | userId: " + userId);

            // Forward token to downstream services
            ServerWebExchange mutated = exchange.mutate()
                    .request(r -> r.header("X-USER-ID", userId == null ? "" : userId)
                            .header("X-USER-EMAIL", email == null ? "" : email)
                            .header("X-USER-ROLE", role == null ? "" : role))
                    .build();
            return chain.filter(mutated);

        } catch (Exception e) {
            System.out.println("❌ JWT validation failed: " + e.getMessage());
            exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
            return exchange.getResponse().setComplete();
        }
    }
}
