// repositories/postgres/notification_preference_repository.go
package postgres

import (
	"context"
	"database/sql"

	"github.com/google/uuid"
	"github.com/lib/pq"

	"github.com/matthewmc1/buganizer/models"
	"github.com/matthewmc1/buganizer/repositories"
)

// NotificationPreferenceRepository implements the NotificationPreferenceRepository interface for PostgreSQL
type NotificationPreferenceRepository struct {
	db *sql.DB
}

// NewNotificationPreferenceRepository creates a new PostgreSQL notification preference repository
func NewNotificationPreferenceRepository(db *sql.DB) *NotificationPreferenceRepository {
	return &NotificationPreferenceRepository{
		db: db,
	}
}

// Upsert creates or updates notification preferences for a user
func (r *NotificationPreferenceRepository) Upsert(ctx context.Context, pref *models.NotificationPreference) error {
	query := `
		INSERT INTO notification_preferences (
			user_id, email_notifications, slack_notifications, subscribed_events, updated_at
		) VALUES (
			$1, $2, $3, $4, $5
		)
		ON CONFLICT (user_id) DO UPDATE SET
			email_notifications = $2,
			slack_notifications = $3,
			subscribed_events = $4,
			updated_at = $5
	`

	_, err := r.db.ExecContext(
		ctx,
		query,
		pref.UserID,
		pref.EmailNotifications,
		pref.SlackNotifications,
		pq.Array(pref.SubscribedEvents),
		pref.UpdatedAt,
	)

	return err
}

// GetByUserID retrieves notification preferences for a user
func (r *NotificationPreferenceRepository) GetByUserID(ctx context.Context, userID uuid.UUID) (*models.NotificationPreference, error) {
	query := `
		SELECT
			user_id, email_notifications, slack_notifications, subscribed_events, updated_at
		FROM notification_preferences
		WHERE user_id = $1
	`

	var pref models.NotificationPreference
	var subscribedEvents []string

	err := r.db.QueryRowContext(
		ctx,
		query,
		userID,
	).Scan(
		&pref.UserID,
		&pref.EmailNotifications,
		&pref.SlackNotifications,
		pq.Array(&subscribedEvents),
		&pref.UpdatedAt,
	)

	if err != nil {
		return nil, err
	}

	pref.SubscribedEvents = subscribedEvents

	return &pref, nil
}

// Ensure NotificationPreferenceRepository implements repositories.NotificationPreferenceRepository
var _ repositories.NotificationPreferenceRepository = (*NotificationPreferenceRepository)(nil)
