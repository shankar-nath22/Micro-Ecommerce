package models

import (
	"time"
)

type OrderItem struct {
	ProductID string  `json:"productId"`
	Quantity  int     `json:"quantity"`
	Price     float64 `json:"price"`
}

type Order struct {
	ID        uint        `json:"id" gorm:"primaryKey"`
	UserID    string      `json:"userId"`
	Items     []OrderItem `json:"items" gorm:"-"`
	Total     float64     `json:"total"`
	CreatedAt time.Time   `json:"createdAt"`
}
