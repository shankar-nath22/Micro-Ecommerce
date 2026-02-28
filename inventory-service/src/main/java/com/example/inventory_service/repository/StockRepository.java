package com.example.inventory_service.repository;

import com.example.inventory_service.model.Stock;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.Optional;

public interface StockRepository extends MongoRepository<Stock, String> {
    Optional<Stock> findByProductId(String productId);
}
