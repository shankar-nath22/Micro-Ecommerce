package com.example.inventory_service.controller;

import com.example.inventory_service.model.Stock;
import com.example.inventory_service.repository.StockRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/inventory")
public class InventoryController {

    @Autowired
    private StockRepository repository;

    @PostMapping("/stock")
    public ResponseEntity<?> updateStock(@RequestBody Stock stock,
            @RequestHeader(value = "X-USER-ROLE", required = false) String role) {
        if (!"ADMIN".equalsIgnoreCase(role)) {
            return ResponseEntity.status(403).body("Only ADMIN can update stock");
        }
        Stock existing = repository.findByProductId(stock.getProductId()).orElse(new Stock());
        existing.setProductId(stock.getProductId());
        existing.setQuantity(stock.getQuantity());
        repository.save(existing);
        return ResponseEntity.ok(existing);
    }

    @GetMapping("/stock/{productId}")
    public ResponseEntity<?> getStock(@PathVariable String productId) {
        return repository.findByProductId(productId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/stocks")
    public ResponseEntity<?> getStocks(@RequestBody List<String> productIds) {
        return ResponseEntity.ok(repository.findAllByProductIdIn(productIds));
    }
}
