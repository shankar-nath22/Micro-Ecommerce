package com.example.inventory_service.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@Document(collection = "stocks")
public class Stock {
    @Id
    private String id;
    private String productId;
    private Integer quantity;
}
