package controllers

import (
	"fmt"
	"log"
	"net/http"
	"order-service/db"
	"order-service/models"
	"order-service/services"

	"github.com/gin-gonic/gin"
)

func CreateOrder(c *gin.Context) {
	var body struct {
		UserID string `json:"userId"`
	}

	if err := c.BindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing userId"})
		return
	}

	// 1. Get cart items
	cart, err := services.GetCart(body.UserID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch cart"})
		return
	}

	var items []models.OrderItem
	total := 0.0

	// 2. Fetch product info + calculate total
	for productID, qty := range cart {
		product, err := services.GetProduct(productID)
		if err != nil {
			log.Println("Error fetching product:", err)
			continue
		}

		item := models.OrderItem{
			ProductID: product.ID,
			Quantity:  qty,
			Price:     product.Price,
		}

		items = append(items, item)
		total += float64(qty) * product.Price
	}

	// 3. Save order to DB
	order := models.Order{
		UserID: body.UserID,
		Items:  items,
		Total:  total,
	}

	db.DB.Create(&order)

	fmt.Println("Order created:", order)

	c.JSON(http.StatusOK, gin.H{
		"order": order,
	})
}
