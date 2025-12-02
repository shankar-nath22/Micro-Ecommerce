package db

import (
	"fmt"
	"log"

	"order-service/models"  // <-- important: import your models

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB

func Connect() {
	dsn := "host=localhost user=postgres password=1234 dbname=order_db port=5433 sslmode=disable"
	var err error

	DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("Database connection failed!", err)
	}

	fmt.Println("📦 Connected to PostgreSQL Order DB")

	// ---------------------------------------------
	// 🟢 AUTO MIGRATE YOUR DATABASE TABLES HERE
	// ---------------------------------------------
	err = DB.AutoMigrate(&models.Order{}, &models.OrderItem{})
	if err != nil {
		log.Fatal("❌ AutoMigrate failed!", err)
	}

	fmt.Println("🛠️ Migrated Order + OrderItem tables")
}
