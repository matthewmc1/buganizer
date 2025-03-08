// models/notification_preference.go
package models

import (
	"time"

	"github.com/google/uuid"
)

// NotificationPreference represents a user's notification settings
type NotificationPreference struct {
	UserID             uuid.UUID `json:"user_id" db:"user_id"`
	EmailNotifications bool      `json:"email_notifications" db:"email_notifications"`
	SlackNotifications bool      `json:"slack_notifications" db:"slack_notifications"`
	SubscribedEvents   []string  `json:"subscribed_events" db:"subscribed_events"` // Types of events to be notified about
	UpdatedAt          time.Time `json:"updated_at" db:"updated_at"`
}
