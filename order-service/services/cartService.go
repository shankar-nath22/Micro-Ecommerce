package services

import (
	"encoding/json"
	"fmt"
	"os"

	"github.com/go-resty/resty/v2"
)

func getCartServiceURL() string {
	url := os.Getenv("CART_URL")
	if url == "" {
		return "http://cart-service:8083/cart"
	}
	return url + "/cart"
}

func GetCart(userId string) (map[string]int, error) {
	client := resty.New()

	// Make request
	resp, err := client.R().
		Get(fmt.Sprintf("%s/%s", getCartServiceURL(), userId))

	if err != nil {
		return nil, err
	}

	// Parse response directly into map[string]int
	var cart map[string]int
	err = json.Unmarshal(resp.Body(), &cart)
	if err != nil {
		return nil, fmt.Errorf("failed to unmarshal cart: %v, body: %s", err, string(resp.Body()))
	}

	return cart, nil
}

func ClearCart(userId string) error {
	client := resty.New()
	resp, err := client.R().
		Delete(fmt.Sprintf("%s/%s", getCartServiceURL(), userId))

	if err != nil {
		return err
	}

	if resp.IsError() {
		return fmt.Errorf("failed to clear cart: %s", resp.String())
	}

	return nil
}
