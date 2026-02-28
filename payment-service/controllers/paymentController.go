package controllers

import (
	"net/http"
	"payment-service/db"
	"payment-service/models"

	"github.com/gin-gonic/gin"
)

func AddBalance(c *gin.Context) {
	var body struct {
		UserID string  `json:"userId"`
		Amount float64 `json:"amount"`
	}

	if err := c.BindJSON(&body); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	var wallet models.Wallet
	db.DB.Where("user_id = ?", body.UserID).FirstOrCreate(&wallet, models.Wallet{UserID: body.UserID})

	wallet.Balance += body.Amount
	db.DB.Save(&wallet)

	c.JSON(http.StatusOK, wallet)
}

func GetWallet(c *gin.Context) {
	userId := c.Param("userId")
	var wallet models.Wallet
	if err := db.DB.Where("user_id = ?", userId).First(&wallet).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Wallet not found"})
		return
	}
	c.JSON(http.StatusOK, wallet)
}
