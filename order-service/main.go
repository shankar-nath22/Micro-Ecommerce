package main

import (
	"fmt"
	"order-service/controllers"
	"order-service/db"
	"order-service/middleware"
	"order-service/services"

	"github.com/gin-gonic/gin"
)

func main() {
	db.Connect()
	services.InitKafka()

	fmt.Println("🚀 Order Service started on port 8084")

	r := gin.Default()

	// r.POST("/orders", controllers.CreateOrder)
	r.POST("/orders", middleware.Authenticate(), controllers.CreateOrder)
	r.GET("/orders", middleware.Authenticate(), controllers.GetOrders)

	r.GET("/", func(c *gin.Context) {
		c.JSON(200, gin.H{"message": "Order service running"})
	})

	r.Run(":8084")
}
