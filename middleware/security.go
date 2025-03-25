// server/middleware/security.go

package middleware

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"strings"

	"github.com/matthewmc1/buganizer/models"
	"github.com/matthewmc1/buganizer/services/auth"
)

// Key types for context values
type contextKey string

const (
	UserIDKey         contextKey = "userId"
	OrganizationIDKey contextKey = "organizationId"
)

// SecurityMiddleware enforces tenant isolation and authentication
func SecurityMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Extract and validate JWT token
		token, err := extractTokenFromHeader(r)
		if token == "" {
			http.Error(w, "Unauthorized: Missing authentication token", http.StatusUnauthorized)
			return
		}

		// Validate token and extract claims
		claims, err := auth.ValidateToken()VerifyToken(token)
		if err != nil {
			http.Error(w, "Unauthorized: Invalid token", http.StatusUnauthorized)
			return
		}

		// Extract user and organization IDs from claims
		userID, ok := claims["sub"].(string)
		if !ok || userID == "" {
			http.Error(w, "Unauthorized: Invalid token claims", http.StatusUnauthorized)
			return
		}

		orgID, ok := claims["organizationId"].(string)
		if !ok || orgID == "" {
			http.Error(w, "Unauthorized: Missing organization context", http.StatusForbidden)
			return
		}

		// Add user ID and organization ID to request context
		ctx := context.WithValue(r.Context(), UserIDKey, userID)
		ctx = context.WithValue(ctx, OrganizationIDKey, orgID)

		// Continue with the updated context
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// PermissionMiddleware checks if the user has the required permission
func PermissionMiddleware(resource string, action string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// Get user and organization IDs from context
			userID := r.Context().Value(UserIDKey).(string)
			orgID := r.Context().Value(OrganizationIDKey).(string)

			// Check user's permissions
			hasPermission, err := CheckPermission(r.Context(), userID, orgID, resource, action)
			if err != nil {
				http.Error(w, "Error checking permissions", http.StatusInternalServerError)
				return
			}

			if !hasPermission {
				http.Error(w, "Forbidden: Insufficient permissions", http.StatusForbidden)
				return
			}

			// User has permission, continue
			next.ServeHTTP(w, r)
		})
	}
}

// Add this function to your middleware/security.go
func extractTokenFromHeader(r *http.Request) (string, error) {
	bearToken := r.Header.Get("Authorization")
	if bearToken == "" {
		return "", errors.New("authorization header is required")
	}

	// Check if the token is in the format "Bearer {token}"
	strArr := strings.Split(bearToken, " ")
	if len(strArr) != 2 {
		return "", errors.New("invalid token format")
	}

	return strArr[1], nil
}

// CheckPermission verifies if a user has a specific permission
func CheckPermission(ctx context.Context, userID string, orgID string, resource string, action string) (bool, error) {
	// Get roles for this user in this organization
	var roles []models.UserRole
	if err := models.DB.Where("user_id = ? AND organization_id = ?", userID, orgID).Find(&roles).Error; err != nil {
		return false, err
	}

	// Check for admin role (can do anything)
	for _, role := range roles {
		if role.Role == "ADMIN" {
			return true, nil
		}
	}

	// Check permissions matrix
	permissionMatrix := map[string]map[string][]string{
		"ADMIN": {
			"issue":        []string{"create", "read", "update", "delete"},
			"team":         []string{"create", "read", "update", "delete"},
			"assignment":   []string{"create", "read", "update", "delete"},
			"user":         []string{"invite", "read", "update", "remove"},
			"organization": []string{"read", "update"},
		},
		"MANAGER": {
			"issue":        []string{"create", "read", "update", "delete"},
			"team":         []string{"read", "update"},
			"assignment":   []string{"create", "read", "update", "delete"},
			"user":         []string{"invite", "read"},
			"organization": []string{"read"},
		},
		"DEVELOPER": {
			"issue":        []string{"create", "read", "update"},
			"team":         []string{"read"},
			"assignment":   []string{"read", "update"},
			"user":         []string{"read"},
			"organization": []string{"read"},
		},
		"VIEWER": {
			"issue":        []string{"read"},
			"team":         []string{"read"},
			"assignment":   []string{"read"},
			"user":         []string{"read"},
			"organization": []string{"read"},
		},
	}

	// Check if any role has the required permission
	for _, role := range roles {
		actions, resourceExists := permissionMatrix[role.Role][resource]
		if resourceExists {
			for _, allowedAction := range actions {
				if allowedAction == action {
					return true, nil
				}
			}
		}
	}

	return false, nil
}

// Example Go repository function with organization scoping
func GetIssueByID(ctx context.Context, issueID string) (*models.Issue, error) {
	// Extract organization ID from context
	orgID, ok := ctx.Value(OrganizationIDKey).(string)
	if !ok {
		return nil, fmt.Errorf("missing organization context")
	}

	var issue models.Issue
	if err := models.DB.Where("id = ? AND organization_id = ?", issueID, orgID).First(&issue).Error; err != nil {
		return nil, err
	}

	return &issue, nil
}
