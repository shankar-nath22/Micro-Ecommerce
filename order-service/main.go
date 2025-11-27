package main

import (
	"order-service/controllers"
	"order-service/db"
	"order-service/middleware"

	"github.com/gin-gonic/gin"
)

func main() {
	db.Connect()

	r := gin.Default()

	// r.POST("/orders", controllers.CreateOrder)
	r.POST("/orders", middleware.Authenticate(), controllers.CreateOrder)

	r.GET("/", func(c *gin.Context) {
		c.JSON(200, gin.H{"message": "Order service running"})
	})

	r.Run(":8084")
}
