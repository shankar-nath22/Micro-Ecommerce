package services

import (
	"context"
	"encoding/json"
	"log"
	"os"
	"payment-service/db"
	"payment-service/models"
	"strings"

	"github.com/segmentio/kafka-go"
)

var writer *kafka.Writer

func getKafkaBrokers() []string {
	brokers := os.Getenv("KAFKA_BROKERS")
	if brokers == "" {
		return []string{"kafka:9092"}
	}
	return strings.Split(brokers, ",")
}

func InitKafka() {
	writer = &kafka.Writer{
		Addr:     kafka.TCP(getKafkaBrokers()...),
		Topic:    "payment_events",
		Balancer: &kafka.LeastBytes{},
	}

	go ConsumeOrders()
}

func ConsumeOrders() {
	reader := kafka.NewReader(kafka.ReaderConfig{
		Brokers: getKafkaBrokers(),
		Topic:   "order_events",
		GroupID: "payment-group",
	})

	log.Println("📥 Payment Service: Consuming order_events...")

	for {
		m, err := reader.ReadMessage(context.Background())
		if err != nil {
			log.Println("❌ Error reading order message:", err)
			break
		}

		var order struct {
			ID     uint    `json:"ID"`
			UserID string  `json:"userId"`
			Total  float64 `json:"total"`
		}

		if err := json.Unmarshal(m.Value, &order); err != nil {
			log.Println("❌ Error unmarshalling order:", err)
			continue
		}

		log.Printf("💳 Processing payment for Order ID: %d, User: %s, Amount: %.2f", order.ID, order.UserID, order.Total)
		processPayment(order.ID, order.UserID, order.Total)
	}
}

func processPayment(orderID uint, userID string, amount float64) {
	var wallet models.Wallet
	res := db.DB.Where("user_id = ?", userID).First(&wallet)

	status := "FAILED"
	if res.Error == nil && wallet.Balance >= amount {
		wallet.Balance -= amount
		db.DB.Save(&wallet)
		status = "SUCCESS"
		log.Printf("✅ Payment SUCCESS for Order %d", orderID)
	} else {
		log.Printf("❌ Payment FAILED for Order %d (Insufficient balance or no wallet)", orderID)
	}

	payment := models.Payment{
		OrderID: orderID,
		UserID:  userID,
		Amount:  amount,
		Status:  status,
	}
	db.DB.Create(&payment)

	emitPaymentStatus(orderID, status)
}

func emitPaymentStatus(orderID uint, status string) {
	event := map[string]interface{}{
		"orderId": orderID,
		"status":  status,
	}

	msgBytes, _ := json.Marshal(event)
	writer.WriteMessages(context.Background(), kafka.Message{Value: msgBytes})
}
