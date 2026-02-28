package com.example.auth_service.controller;

import com.example.auth_service.model.User;
import com.example.auth_service.repository.UserRepository;
import com.example.auth_service.util.JwtUtil;
import com.example.auth_service.dto.LoginRequest;
import com.example.auth_service.dto.SignupRequest;
import com.example.auth_service.dto.ProfileResponse;
import com.example.auth_service.dto.ProfileUpdateRequest;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/auth")
public class AuthController {

    @Autowired
    private UserRepository repo;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    @PostMapping("/signup")
    public ResponseEntity<?> signup(@Valid @RequestBody SignupRequest req) {

        String email = req.getEmail();
        String rawPassword = req.getPassword();
        String role = req.getRole();

        if (repo.findByEmail(email).isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email already exists"));
        }

        User user = new User();
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(rawPassword));
        user.setRole(role.toUpperCase());

        user.setName(req.getName());
        user.setAge(req.getAge());
        user.setGender(req.getGender());
        user.setPhone(req.getPhone());
        user.setAddress(req.getAddress());

        repo.save(user);

        return ResponseEntity.ok(Map.of("message", "Signup successful"));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest req) {

        String email = req.getEmail();
        String password = req.getPassword();

        User user = repo.findByEmail(email).orElse(null);

        if (user == null || !passwordEncoder.matches(password, user.getPassword())) {
            return ResponseEntity.status(401).body(Map.of("error", "Invalid credentials"));
        }

        String accessToken = jwtUtil.generateToken(user.getId(), user.getEmail(), user.getRole());
        String refreshToken = jwtUtil.generateRefreshToken(user.getEmail());

        user.setRefreshToken(refreshToken);
        repo.save(user);

        return ResponseEntity.ok(Map.of(
                "token", accessToken,
                "refreshToken", refreshToken,
                "email", user.getEmail(),
                "name", user.getName() != null ? user.getName() : "",
                "role", user.getRole(),
                "userId", user.getId()));
    }

    @PostMapping("/refresh")
    public ResponseEntity<?> refresh(@RequestBody Map<String, String> req) {
        String refreshToken = req.get("token");

        if (refreshToken == null || !jwtUtil.validateToken(refreshToken)) {
            return ResponseEntity.status(401).body(Map.of("error", "Invalid refresh token"));
        }

        String email = jwtUtil.extractClaims(refreshToken).getSubject();
        User user = repo.findByEmail(email).orElse(null);

        if (user == null || !refreshToken.equals(user.getRefreshToken())) {
            return ResponseEntity.status(401).body(Map.of("error", "Invalid refresh token"));
        }

        String newAccessToken = jwtUtil.generateToken(user.getId(), user.getEmail(), user.getRole());

        return ResponseEntity.ok(Map.of("token", newAccessToken));
    }

    @GetMapping("/profile")
    public ResponseEntity<?> getProfile(@RequestHeader("Authorization") String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }

        String token = authHeader.substring(7);
        if (!jwtUtil.validateToken(token)) {
            return ResponseEntity.status(401).body(Map.of("error", "Invalid token"));
        }

        String email = jwtUtil.extractClaims(token).getSubject();
        User user = repo.findByEmail(email).orElse(null);

        if (user == null) {
            return ResponseEntity.status(404).body(Map.of("error", "User not found"));
        }

        ProfileResponse response = new ProfileResponse(
                user.getEmail(),
                user.getName(),
                user.getAge(),
                user.getGender(),
                user.getPhone(),
                user.getAddress());

        return ResponseEntity.ok(response);
    }

    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(@RequestHeader("Authorization") String authHeader,
            @RequestBody ProfileUpdateRequest req) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }

        String token = authHeader.substring(7);
        if (!jwtUtil.validateToken(token)) {
            return ResponseEntity.status(401).body(Map.of("error", "Invalid token"));
        }

        String email = jwtUtil.extractClaims(token).getSubject();
        User user = repo.findByEmail(email).orElse(null);

        if (user == null) {
            return ResponseEntity.status(404).body(Map.of("error", "User not found"));
        }

        user.setName(req.getName());
        user.setAge(req.getAge());
        user.setGender(req.getGender());
        user.setPhone(req.getPhone());
        user.setAddress(req.getAddress());

        repo.save(user);

        return ResponseEntity.ok(Map.of("message", "Profile updated successfully"));
    }

    @DeleteMapping("/profile")
    public ResponseEntity<?> deleteProfile(@RequestHeader("Authorization") String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(401).body(Map.of("error", "Unauthorized"));
        }

        String token = authHeader.substring(7);
        if (!jwtUtil.validateToken(token)) {
            return ResponseEntity.status(401).body(Map.of("error", "Invalid token"));
        }

        String email = jwtUtil.extractClaims(token).getSubject();
        User user = repo.findByEmail(email).orElse(null);

        if (user == null) {
            return ResponseEntity.status(404).body(Map.of("error", "User not found"));
        }

        repo.delete(user);

        return ResponseEntity.ok(Map.of("message", "Account deleted successfully"));
    }
}
