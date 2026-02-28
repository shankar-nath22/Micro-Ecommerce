package services

import (
	"context"
	"encoding/json"
	"log"
	"os"
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
		Topic:    "order_events",
		Balancer: &kafka.LeastBytes{},
	}
	log.Println("📢 Kafka Producer initialized")
}

func EmitOrderCreated(order interface{}) {
	if writer == nil {
		log.Println("❌ Kafka Writer not initialized")
		return
	}

	msgBytes, err := json.Marshal(order)
	if err != nil {
		log.Println("❌ Failed to marshal order:", err)
		return
	}

	err = writer.WriteMessages(context.Background(),
		kafka.Message{
			Value: msgBytes,
		},
	)

	if err != nil {
		log.Println("❌ Failed to emit Kafka message:", err)
		return
	}

	log.Println("🚀 OrderCreated event emitted to Kafka")
}
