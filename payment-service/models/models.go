package models

import "gorm.io/gorm"

type Wallet struct {
	gorm.Model
	UserID  string  `gorm:"uniqueIndex" json:"userId"`
	Balance float64 `json:"balance"`
}

type Payment struct {
	gorm.Model
	OrderID uint    `json:"orderId" gorm:"index"`
	UserID  string  `json:"userId" gorm:"index"`
	Amount  float64 `json:"amount"`
	Status  string  `json:"status"` // SUCCESS, FAILED
}
