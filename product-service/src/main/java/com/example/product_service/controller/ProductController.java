package com.example.product_service.controller;

import com.example.product_service.model.Product;
import com.example.product_service.service.ProductService;

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
    private ProductService productService;

    // CREATE
    @PostMapping
    public ResponseEntity<?> create(@Valid @RequestBody Product product,
            @RequestHeader(value = "X-USER-ROLE", required = false) String role) {
        if (!"ADMIN".equalsIgnoreCase(role)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Only ADMIN can create products");
        }
        return ResponseEntity.ok(productService.save(product));
    }

    // READ — Advanced Filtering (Multi-category, Price Range, Stock)
    @GetMapping
    public ResponseEntity<List<Product>> getAll(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) List<String> categories,
            @RequestParam(required = false) Double minPrice,
            @RequestParam(required = false) Double maxPrice,
            @RequestParam(required = false) Boolean inStock) {

        return ResponseEntity.ok(productService.getAllProducts(name, categories, minPrice, maxPrice, inStock));
    }

    // READ — Get by ID (fixed)
    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable String id) {
        Product p = productService.getById(id);
        if (p == null) {
            return ResponseEntity.status(404).body("Product not found");
        }
        return ResponseEntity.ok(p);
    }

    // UPDATE (fixed)
    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable String id, @Valid @RequestBody Product updated,
            @RequestHeader(value = "X-USER-ROLE", required = false) String role) {
        if (!"ADMIN".equalsIgnoreCase(role)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Only ADMIN can update products");
        }
        Product existing = productService.getById(id);
        if (existing == null) {
            return ResponseEntity.status(404).body("Product not found");
        }

        existing.setName(updated.getName());
        existing.setDescription(updated.getDescription());
        existing.setPrice(updated.getPrice());
        existing.setStock(updated.getStock());
        existing.setImageUrls(updated.getImageUrls());
        existing.setCategory(updated.getCategory());

        productService.save(existing);
        return ResponseEntity.ok(existing);
    }

    // DELETE (fixed)
    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable String id,
            @RequestHeader(value = "X-USER-ROLE", required = false) String role) {
        if (!"ADMIN".equalsIgnoreCase(role)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Only ADMIN can delete products");
        }
        Product p = productService.getById(id);
        if (p == null) {
            return ResponseEntity.status(404).body("Product not found");
        }
        p.setIsActive(false);
        productService.save(p);
        return ResponseEntity.ok("Deleted");
    }

    // ATOMIC STOCK DEDUCTION
    @PostMapping("/{id}/deduct")
    public ResponseEntity<?> deductStock(@PathVariable String id, @RequestParam int quantity) {
        if (quantity <= 0) {
            return ResponseEntity.badRequest().body("Quantity must be greater than zero");
        }

        Product updatedProduct = productService.deductStock(id, quantity);

        if (updatedProduct == null) {
            if (!productService.existsById(id)) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Product not found");
            }
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Insufficient stock or product inactive");
        }

        return ResponseEntity.ok(updatedProduct);
    }
}
