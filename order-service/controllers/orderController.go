package controllers

import (
	"log"
	"net/http"
	"order-service/db"
	"order-service/models"
	"order-service/services"

	"github.com/gin-gonic/gin"
)

func CreateOrder(c *gin.Context) {
	userId := c.GetString("userId")
	if userId == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user id not found"})
		return
	}

	role := c.GetString("userRole")
	if role != "USER" && role != "ADMIN" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Only USER can place orders"})
		return
	}

	// 1. Get cart items
	cart, err := services.GetCart(userId)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch cart"})
		return
	}

	var items []models.OrderItem
	total := 0.0

	// 2. Fetch product info + calculate total + DEDUCT stock
	for productID, qty := range cart {
		// Dedut stock atomically
		err := services.DeductStock(productID, qty)
		if err != nil {
			log.Println("❌ Stock deduction failed:", err)
			c.JSON(http.StatusBadRequest, gin.H{"error": "Insufficient stock or product unavailable: " + productID})
			return
		}

		// Fetch for price and info (now that we know stock is secured)
		product, err := services.GetProduct(productID)
		if err != nil {
			log.Println("Error fetching product details:", err)
			continue
		}

		item := models.OrderItem{
			ProductID:   product.ID,
			ProductName: product.Name,
			Quantity:    qty,
			Price:       product.Price,
		}

		items = append(items, item)
		total += float64(qty) * product.Price
	}

	// 3. Save order to DB
	order := models.Order{
		UserID: userId,
		Items:  items,
		Total:  total,
	}

	result := db.DB.Create(&order)
	if result.Error != nil {
		log.Println("❌ Failed to save order to DB:", result.Error)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save order"})
		return
	}

	// 4. Emit Kafka Event
	services.EmitOrderCreated(order)

	// 5. Clear Cart (Internal)
	err = services.ClearCart(userId)
	if err != nil {
		log.Println("Warning: Failed to clear cart:", err)
	}

	log.Printf("✅ Order #%d created for user %s with %d items", order.ID, userId, len(order.Items))

	c.JSON(http.StatusOK, gin.H{
		"order": order,
	})
}

func GetOrders(c *gin.Context) {
	userId := c.GetString("userId")
	if userId == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "user id not found"})
		return
	}

	var orders []models.Order
	result := db.DB.Preload("Items").Where("user_id = ?", userId).Order("created_at desc").Find(&orders)
	if result.Error != nil {
		log.Printf("❌ Failed to fetch orders for user %s: %v", userId, result.Error)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch orders"})
		return
	}

	log.Printf("📥 Fetched %d orders for user %s", len(orders), userId)
	c.JSON(http.StatusOK, orders)
}
