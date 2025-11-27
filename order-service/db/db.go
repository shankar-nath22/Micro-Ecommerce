package db
// 6927acd01e4e2bbe93ee0e64
import (
	"fmt"
	"log"
	// "os"

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
}
