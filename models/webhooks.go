// models/webhook.go
package models

import (
	"time"

	"github.com/google/uuid"
)

// Webhook represents a webhook endpoint for notifications
type Webhook struct {
	ID           uuid.UUID  `json:"id" db:"id"`
	URL          string     `json:"url" db:"url"`
	Description  string     `json:"description" db:"description"`
	Secret       string     `json:"secret" db:"secret"` // For signing payloads
	CreatorID    uuid.UUID  `json:"creator_id" db:"creator_id"`
	EventTypes   []string   `json:"event_types" db:"event_types"` // Types of events to notify about
	CreatedAt    time.Time  `json:"created_at" db:"created_at"`
	LastCalledAt *time.Time `json:"last_called_at,omitempty" db:"last_called_at"`
	LastSuccess  *bool      `json:"last_success,omitempty" db:"last_success"`
}
