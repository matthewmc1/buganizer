// In models/user.go or similar file
package models

import "time"

type UserRole struct {
	ID             string    `json:"id"`
	UserID         string    `json:"userId"`
	OrganizationID string    `json:"organizationId"`
	Role           string    `json:"role"` // e.g., "ADMIN", "MANAGER", etc.
	TeamID         *string   `json:"teamId,omitempty"`
	CreatedAt      time.Time `json:"createdAt"`
	UpdatedAt      time.Time `json:"updatedAt"`
}
