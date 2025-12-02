package middleware

import (
	"net/http"
	"strings"
	"fmt"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

func getEnv(k, def string) string {
	if v := os.Getenv(k); v != "" {
		return v
	}
	return def
}

// var JwtSecret = []byte(getEnv("JWT_SECRET",
// 	"FmX2a9Pce4zQ1Lp98NsTy7WqR5vUb6KdGh1Jm2LoWp9Zx3YqHr8St4VuCe7xDf9",
// ))
var JwtSecret = []byte(os.Getenv("JWT_SECRET"))


func Authenticate() gin.HandlerFunc {
	return func(c *gin.Context) {
		auth := c.GetHeader("Authorization")
		if auth == "" || !strings.HasPrefix(auth, "Bearer ") {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "missing token"})
			return
		}

		tokenStr := strings.TrimPrefix(auth, "Bearer ")

		token, err := jwt.Parse(tokenStr, func(t *jwt.Token) (interface{}, error) {
			if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fmt.Errorf("unexpected signing method")
			}
			return JwtSecret, nil
		})

		if err != nil || !token.Valid {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid token"})
			return
		}

		claims := token.Claims.(jwt.MapClaims)
		email := claims["sub"].(string)
		role := claims["role"].(string)

		c.Set("userEmail", email)
		c.Set("userRole", role)

		c.Next()
	}
}
