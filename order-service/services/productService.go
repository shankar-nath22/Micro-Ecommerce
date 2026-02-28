package services

import (
	"fmt"
	"os"

	"github.com/go-resty/resty/v2"
)

func getProductServiceURL() string {
	url := os.Getenv("PRODUCT_URL")
	if url == "" {
		return "http://product-service:8082"
	}
	return url
}

type Product struct {
	ID    string  `json:"id"`
	Name  string  `json:"name"`
	Price float64 `json:"price"`
	Stock int     `json:"stock"`
}

func GetProduct(id string) (*Product, error) {
	client := resty.New()

	product := Product{}

	_, err := client.R().
		SetResult(&product).
		Get(fmt.Sprintf("%s/products/%s", getProductServiceURL(), id))

	if err != nil {
		return nil, err
	}

	return &product, nil
}
