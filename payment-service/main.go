package main

import (
	"fmt"
	"payment-service/controllers"
	"payment-service/db"
	"payment-service/services"

	"github.com/gin-gonic/gin"
)

func main() {
	db.Connect()
	services.InitKafka()

	r := gin.Default()

	r.POST("/payments/wallet/add", controllers.AddBalance)
	r.GET("/payments/wallet/:userId", controllers.GetWallet)

	fmt.Println("🚀 Payment Service started on port 8085")
	r.Run(":8085")
}
