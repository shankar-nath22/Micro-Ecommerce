package com.example.product_service.controller;

import com.example.product_service.model.Product;
import com.example.product_service.repository.ProductRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.util.List;

@RestController
@RequestMapping("/products")
public class ProductController {

    @Autowired
    private ProductRepository repo;

    // CREATE
    @PostMapping
    public ResponseEntity<?> create(@Valid @RequestBody Product product,
            @RequestHeader(value = "X-USER-ROLE", required = false) String role) {
        if (!"ADMIN".equalsIgnoreCase(role)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Only ADMIN can create products");
        }
        return ResponseEntity.ok(repo.save(product));
    }

    // READ — Get all or search by name
    @GetMapping
    public ResponseEntity<List<Product>> getAll(@RequestParam(required = false) String name) {
        if (name != null && !name.trim().isEmpty()) {
            return ResponseEntity.ok(repo.findByNameContainingIgnoreCaseAndIsActiveTrue(name.trim()));
        }
        return ResponseEntity.ok(repo.findByIsActiveTrue());
    }

    // READ — Get by ID (fixed)
    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable String id) {
        return repo.findById(id)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.status(404).body("Product not found"));
    }

    // UPDATE (fixed)
    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable String id, @Valid @RequestBody Product updated,
            @RequestHeader(value = "X-USER-ROLE", required = false) String role) {
        if (!"ADMIN".equalsIgnoreCase(role)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Only ADMIN can update products");
        }
        return repo.findById(id)
                .<ResponseEntity<?>>map(existing -> {
                    existing.setName(updated.getName());
                    existing.setDescription(updated.getDescription());
                    existing.setPrice(updated.getPrice());
                    existing.setStock(updated.getStock());
                    existing.setImageUrls(updated.getImageUrls());
                    repo.save(existing);
                    return ResponseEntity.ok(existing);
                })
                .orElseGet(() -> ResponseEntity.status(404).body("Product not found"));
    }

    // DELETE (fixed)
    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable String id,
            @RequestHeader(value = "X-USER-ROLE", required = false) String role) {
        if (!"ADMIN".equalsIgnoreCase(role)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Only ADMIN can delete products");
        }
        return repo.findById(id).map(p -> {
            p.setIsActive(false);
            repo.save(p);
            return ResponseEntity.ok("Deleted");
        }).orElseGet(() -> ResponseEntity.status(404).body("Product not found"));
    }
}
