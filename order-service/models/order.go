package models

import (
	"time"
)

type OrderItem struct {
	ID          uint    `json:"id" gorm:"primaryKey"`
	OrderID     uint    `json:"orderId" gorm:"index"`
	ProductID   string  `json:"productId" gorm:"index"`
	ProductName string  `json:"productName"`
	Quantity    int     `json:"quantity"`
	Price       float64 `json:"price"`
}

type Order struct {
	ID        uint        `json:"id" gorm:"primaryKey"`
	UserID    string      `json:"userId" gorm:"index"`
	Items     []OrderItem `json:"items" gorm:"foreignKey:OrderID"`
	Total     float64     `json:"total"`
	CreatedAt time.Time   `json:"createdAt"`
}
