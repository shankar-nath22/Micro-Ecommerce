package com.example.product_service.controller;

import com.example.product_service.model.Product;
import com.example.product_service.repository.ProductRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/products")
public class ProductController {

    @Autowired
    private ProductRepository repo;

    // CREATE
    @PostMapping
    public ResponseEntity<Product> create(@RequestBody Product product) {
        return ResponseEntity.ok(repo.save(product));
    }

    // READ — Get all
    @GetMapping
    public ResponseEntity<List<Product>> getAll() {
        return ResponseEntity.ok(repo.findAll());
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
    public ResponseEntity<?> update(@PathVariable String id, @RequestBody Product updated) {

        return repo.findById(id)
                .<ResponseEntity<?>>map(existing -> {
                    existing.setName(updated.getName());
                    existing.setDescription(updated.getDescription());
                    existing.setPrice(updated.getPrice());
                    existing.setStock(updated.getStock());
                    repo.save(existing);
                    return ResponseEntity.ok(existing);
                })
                .orElseGet(() -> ResponseEntity.status(404).body("Product not found"));
    }

    // DELETE (fixed)
    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable String id) {
        return repo.findById(id).map(p -> {
            repo.delete(p);
            return ResponseEntity.ok("Deleted");
        }).orElseGet(() -> ResponseEntity.status(404).body("Product not found"));
    }
}
