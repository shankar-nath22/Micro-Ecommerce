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

func DeductStock(id string, quantity int) error {
	client := resty.New()

	resp, err := client.R().
		SetQueryParam("quantity", fmt.Sprintf("%d", quantity)).
		Post(fmt.Sprintf("%s/products/%s/deduct", getProductServiceURL(), id))

	if err != nil {
		return err
	}

	if resp.StatusCode() != 200 {
		return fmt.Errorf("failed to deduct stock for product %s: %s", id, resp.String())
	}

	return nil
}
