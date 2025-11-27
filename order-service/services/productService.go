package services

import (
	"fmt"

	"github.com/go-resty/resty/v2"
)

var productServiceURL = "http://localhost:8082/products"

type Product struct {
	ID    string  `json:"id"`
	Name  string  `json:"name"`
	Price float64 `json:"price"`
}

func GetProduct(id string) (*Product, error) {
	client := resty.New()

	product := Product{}

	_, err := client.R().
		SetResult(&product).
		Get(fmt.Sprintf("%s/%s", productServiceURL, id))

	if err != nil {
		return nil, err
	}

	return &product, nil
}
