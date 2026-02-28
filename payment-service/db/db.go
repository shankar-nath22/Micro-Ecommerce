package db

import (
	"fmt"
	"log"
	"os"
	"payment-service/models"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB

func Connect() {
	dsn := os.Getenv("DB_DSN")
	if dsn == "" {
		dsn = "host=payment-db user=postgres password=1234 dbname=payment_db port=5432 sslmode=disable"
	}

	var err error
	DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("❌ Failed to connect to Payment DB:", err)
	}

	DB.AutoMigrate(&models.Wallet{}, &models.Payment{})
	fmt.Println("✅ Payment DB connected and migrated")
}
