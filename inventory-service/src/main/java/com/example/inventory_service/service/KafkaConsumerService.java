package com.example.inventory_service.service;

import com.example.inventory_service.model.Stock;
import com.example.inventory_service.repository.StockRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class KafkaConsumerService {

    @Autowired
    private StockRepository repository;

    @Autowired
    private KafkaTemplate<String, String> kafkaTemplate;

    private final ObjectMapper mapper = new ObjectMapper();

    @KafkaListener(topics = "order_events", groupId = "inventory-group")
    public void consumeOrder(String message) {
        try {
            JsonNode node = mapper.readTree(message);
            JsonNode items = node.get("items");

            log.info("📦 Processing inventory for order items");

            if (items != null && items.isArray()) {
                for (JsonNode item : items) {
                    String productId = item.get("productId").asText();
                    int qty = item.get("quantity").asInt();

                    Stock stock = repository.findByProductId(productId).orElse(null);
                    if (stock != null) {
                        stock.setQuantity(stock.getQuantity() - qty);
                        repository.save(stock);
                        log.info("✅ Decremented stock for product: {}", productId);

                        // Low stock check
                        if (stock.getQuantity() <= 5) {
                            String alertMessage = String.format(
                                    "{\"type\": \"LOW_STOCK\", \"productId\": \"%s\", \"currentStock\": %d, \"message\": \"Product stock is running low!\"}",
                                    productId, stock.getQuantity());
                            kafkaTemplate.send("notification_events", alertMessage);
                            log.warn("⚠️ Low stock alert sent for product: {}", productId);
                        }

                    } else {
                        log.warn("❌ Stock not found for product: {}", productId);
                    }
                }
            }
        } catch (Exception e) {
            log.error("❌ Error processing inventory event: {}", e.getMessage());
        }
    }
}
