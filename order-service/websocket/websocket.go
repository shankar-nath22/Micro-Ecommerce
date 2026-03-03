package websocket

import (
	"encoding/json"
	"log"
	"net/http"
	"sync"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true // Allow all origins for simplicity, tighten for production
	},
}

var (
	clients   = make(map[*websocket.Conn]bool)
	clientsMu sync.Mutex
)

// HandleConnections upgrades the HTTP connection to a WebSocket and registers the client.
func HandleConnections(w http.ResponseWriter, r *http.Request) {
	ws, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("WebSocket upgrade failed: %v", err)
		return
	}

	clientsMu.Lock()
	clients[ws] = true
	clientsMu.Unlock()

	log.Println("New WebSocket client connected")

	// We only need to wait for the client to disconnect or error out.
	// In this simple implementation, the server broadcasts to all clients.
	for {
		_, _, err := ws.ReadMessage()
		if err != nil {
			log.Printf("WebSocket client read error/disconnected: %v", err)
			clientsMu.Lock()
			delete(clients, ws)
			clientsMu.Unlock()
			ws.Close()
			break
		}
	}
}

// BroadcastOrderStatus sends an update message to all connected clients.
func BroadcastOrderStatus(orderID uint, status string) {
	message := map[string]interface{}{
		"type":    "ORDER_STATUS_UPDATE",
		"orderId": orderID,
		"status":  status,
	}

	msgBytes, err := json.Marshal(message)
	if err != nil {
		log.Printf("Failed to marshal websocket message: %v", err)
		return
	}

	clientsMu.Lock()
	defer clientsMu.Unlock()

	for client := range clients {
		err := client.WriteMessage(websocket.TextMessage, msgBytes)
		if err != nil {
			log.Printf("Error writing to client: %v", err)
			client.Close()
			delete(clients, client)
		}
	}
}
