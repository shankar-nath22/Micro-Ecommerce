package com.example.product_service.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.index.TextIndexed;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.List;
import java.util.ArrayList;
import java.io.Serializable;
import org.springframework.data.annotation.Transient;

@Document(collection = "products")
public class Product implements Serializable {

    @Id
    private String id;

    @NotBlank(message = "Product name is required")
    @TextIndexed(weight = 3)
    private String name;

    @TextIndexed(weight = 1)
    private String description;

    @NotNull(message = "Price is required")
    @Min(value = 0, message = "Price cannot be negative")
    @Indexed
    private Double price;

    @NotNull(message = "Stock is required")
    @Min(value = 0, message = "Stock cannot be negative")
    @Indexed
    private Integer stock;

    private List<String> imageUrls = new ArrayList<>();
    private Boolean isActive = true; // Default to true for new products

    @Indexed
    @TextIndexed(weight = 2)
    private String category;

    public Product() {
    }

    public Product(String name, String description, Double price, Integer stock, List<String> imageUrls,
            String category) {
        this.name = name;
        this.description = description;
        this.price = price;
        this.stock = stock;
        this.imageUrls = imageUrls != null ? imageUrls : new ArrayList<>();
        this.isActive = true;
        this.category = category;
    }

    // getters & setters
    public Boolean getIsActive() {
        return isActive != null ? isActive : true;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }

    // Transient getter for backward compatibility with single image consumers
    @Transient
    public String getImageUrl() {
        return (imageUrls != null && !imageUrls.isEmpty()) ? imageUrls.get(0) : null;
    }

    public void setImageUrl(String imageUrl) {
        if (imageUrl != null && !imageUrl.trim().isEmpty()) {
            if (this.imageUrls == null)
                this.imageUrls = new ArrayList<>();
            // Avoid duplicates if same URL is sent twice via both fields
            if (!this.imageUrls.contains(imageUrl)) {
                this.imageUrls.add(0, imageUrl);
            }
        }
    }

    public List<String> getImageUrls() {
        return imageUrls;
    }

    public void setImageUrls(List<String> imageUrls) {
        this.imageUrls = imageUrls != null ? imageUrls : new ArrayList<>();
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Double getPrice() {
        return price;
    }

    public void setPrice(Double price) {
        this.price = price;
    }

    public Integer getStock() {
        return stock;
    }

    public void setStock(Integer stock) {
        this.stock = stock;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }
}
