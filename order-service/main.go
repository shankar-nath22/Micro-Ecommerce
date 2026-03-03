package main

import (
	"fmt"
	"order-service/controllers"
	"order-service/db"
	"order-service/middleware"
	"order-service/services"
	"order-service/websocket"

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
	r.GET("/orders/all", middleware.Authenticate(), controllers.GetAllOrders)
	r.PUT("/orders/:id/status", middleware.Authenticate(), controllers.UpdateOrderStatus)

	// WebSocket route for real-time updates
	r.GET("/orders/ws", func(c *gin.Context) {
		websocket.HandleConnections(c.Writer, c.Request)
	})

	r.GET("/", func(c *gin.Context) {
		c.JSON(200, gin.H{"message": "Order service running"})
	})

	r.Run(":8084")
}
