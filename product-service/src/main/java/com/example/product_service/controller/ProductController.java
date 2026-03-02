package com.example.product_service.controller;

import com.example.product_service.model.Product;
import com.example.product_service.repository.ProductRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.data.mongodb.core.FindAndModifyOptions;
import jakarta.validation.Valid;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/products")
public class ProductController {

    @Autowired
    private ProductRepository repo;

    @Autowired
    private MongoTemplate mongoTemplate;

    // CREATE
    @PostMapping
    public ResponseEntity<?> create(@Valid @RequestBody Product product,
            @RequestHeader(value = "X-USER-ROLE", required = false) String role) {
        if (!"ADMIN".equalsIgnoreCase(role)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Only ADMIN can create products");
        }
        return ResponseEntity.ok(repo.save(product));
    }

    // READ — Advanced Filtering (Multi-category, Price Range, Stock)
    @GetMapping
    public ResponseEntity<List<Product>> getAll(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) List<String> categories,
            @RequestParam(required = false) Double minPrice,
            @RequestParam(required = false) Double maxPrice,
            @RequestParam(required = false) Boolean inStock) {

        Query query = new Query();
        query.addCriteria(Criteria.where("isActive").is(true));

        if (name != null && !name.trim().isEmpty()) {
            String sanitizedQuery = name.trim();
            // Split the search query into individual words for partial matching
            String[] searchTerms = sanitizedQuery.split("\\s+");

            // For each term, it must exist in AT LEAST ONE of the target fields (name,
            // description, category)
            List<Criteria> andCriterias = new ArrayList<>();

            for (String term : searchTerms) {
                // Typo tolerance: Match anywhere inside the strings using regex
                String regexPattern = ".*" + term + ".*";

                Criteria orCriteria = new Criteria().orOperator(
                        Criteria.where("name").regex(regexPattern, "i"),
                        Criteria.where("description").regex(regexPattern, "i"),
                        Criteria.where("category").regex(regexPattern, "i"));

                andCriterias.add(orCriteria);
            }

            // Using a top-level AND operator to ensure ALL typed words are found somewhere
            if (!andCriterias.isEmpty()) {
                query.addCriteria(new Criteria().andOperator(andCriterias.toArray(new Criteria[0])));
            }
        }

        if (categories != null && !categories.isEmpty()) {
            query.addCriteria(Criteria.where("category").in(categories));
        }

        if (minPrice != null || maxPrice != null) {
            Criteria priceCriteria = Criteria.where("price");
            if (minPrice != null)
                priceCriteria.gte(minPrice);
            if (maxPrice != null)
                priceCriteria.lte(maxPrice);
            query.addCriteria(priceCriteria);
        }

        if (Boolean.TRUE.equals(inStock)) {
            query.addCriteria(Criteria.where("stock").gt(0));
        }

        return ResponseEntity.ok(mongoTemplate.find(query, Product.class));
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
                    existing.setCategory(updated.getCategory());
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

    // ATOMIC STOCK DEDUCTION
    @PostMapping("/{id}/deduct")
    public ResponseEntity<?> deductStock(@PathVariable String id, @RequestParam int quantity) {
        if (quantity <= 0) {
            return ResponseEntity.badRequest().body("Quantity must be greater than zero");
        }

        Query query = new Query(Criteria.where("id").is(id).and("stock").gte(quantity));
        Update update = new Update().inc("stock", -quantity);
        FindAndModifyOptions options = new FindAndModifyOptions().returnNew(true);

        Product updatedProduct = mongoTemplate.findAndModify(query, update, options, Product.class);

        if (updatedProduct == null) {
            // Check if product exists at all
            if (!repo.existsById(id)) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Product not found");
            }
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Insufficient stock or product inactive");
        }

        return ResponseEntity.ok(updatedProduct);
    }
}
