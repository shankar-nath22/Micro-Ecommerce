package services

import (
	"encoding/json"
	"fmt"

	"github.com/go-resty/resty/v2"
)

var cartServiceURL = "http://localhost:8083/cart"

func GetCart(userId string) (map[string]int, error) {
	client := resty.New()

	// Make request
	resp, err := client.R().
		Get(fmt.Sprintf("%s/%s", cartServiceURL, userId))

	if err != nil {
		return nil, err
	}

	// Parse response directly into map[string]string
	var raw map[string]string
	err = json.Unmarshal(resp.Body(), &raw)
	if err != nil {
		return nil, err
	}

	cart := map[string]int{}

	// Convert string quantity → int
	for productID, qtyStr := range raw {
		var qty int
		fmt.Sscanf(qtyStr, "%d", &qty) // convert "2" → 2
		cart[productID] = qty
	}

	return cart, nil
}
