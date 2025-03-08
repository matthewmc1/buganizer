// repositories/postgres/webhook_repository.go
package postgres

import (
	"context"
	"database/sql"
	"time"

	"github.com/google/uuid"
	"github.com/lib/pq"

	"github.com/matthewmc1/buganizer/models"
	"github.com/matthewmc1/buganizer/repositories"
)

// WebhookRepository implements the WebhookRepository interface for PostgreSQL
type WebhookRepository struct {
	db *sql.DB
}

// NewWebhookRepository creates a new PostgreSQL webhook repository
func NewWebhookRepository(db *sql.DB) *WebhookRepository {
	return &WebhookRepository{
		db: db,
	}
}

// Create adds a new webhook to the database
func (r *WebhookRepository) Create(ctx context.Context, webhook *models.Webhook) error {
	query := `
		INSERT INTO webhooks (
			id, url, description, secret, creator_id, event_types, created_at,
			last_called_at, last_success
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9
		)
	`

	_, err := r.db.ExecContext(
		ctx,
		query,
		webhook.ID,
		webhook.URL,
		webhook.Description,
		webhook.Secret,
		webhook.CreatorID,
		pq.Array(webhook.EventTypes),
		webhook.CreatedAt,
		webhook.LastCalledAt,
		webhook.LastSuccess,
	)

	return err
}

// GetByID retrieves a webhook by its ID
func (r *WebhookRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.Webhook, error) {
	query := `
		SELECT
			id, url, description, secret, creator_id, event_types, created_at,
			last_called_at, last_success
		FROM webhooks
		WHERE id = $1
	`

	var webhook models.Webhook
	var lastCalledAt sql.NullTime
	var lastSuccess sql.NullBool
	var eventTypes []string

	err := r.db.QueryRowContext(
		ctx,
		query,
		id,
	).Scan(
		&webhook.ID,
		&webhook.URL,
		&webhook.Description,
		&webhook.Secret,
		&webhook.CreatorID,
		pq.Array(&eventTypes),
		&webhook.CreatedAt,
		&lastCalledAt,
		&lastSuccess,
	)

	if err != nil {
		return nil, err
	}

	webhook.EventTypes = eventTypes

	// Handle nullable fields
	if lastCalledAt.Valid {
		webhook.LastCalledAt = &lastCalledAt.Time
	}
	if lastSuccess.Valid {
		webhook.LastSuccess = &lastSuccess.Bool
	}

	return &webhook, nil
}

// Update updates an existing webhook
func (r *WebhookRepository) Update(ctx context.Context, webhook *models.Webhook) error {
	query := `
		UPDATE webhooks
		SET
			url = $1,
			description = $2,
			secret = $3,
			event_types = $4,
			last_called_at = $5,
			last_success = $6
		WHERE id = $7
	`

	_, err := r.db.ExecContext(
		ctx,
		query,
		webhook.URL,
		webhook.Description,
		webhook.Secret,
		pq.Array(webhook.EventTypes),
		webhook.LastCalledAt,
		webhook.LastSuccess,
		webhook.ID,
	)

	return err
}

// UpdateStatus updates the last called time and success status of a webhook
func (r *WebhookRepository) UpdateStatus(ctx context.Context, id uuid.UUID, lastCalledAt *time.Time, success bool) error {
	query := `
		UPDATE webhooks
		SET
			last_called_at = $1,
			last_success = $2
		WHERE id = $3
	`

	_, err := r.db.ExecContext(
		ctx,
		query,
		lastCalledAt,
		success,
		id,
	)

	return err
}

// ListByEventType lists webhooks subscribed to a specific event type
func (r *WebhookRepository) ListByEventType(ctx context.Context, eventType string) ([]models.Webhook, error) {
	query := `
		SELECT
			id, url, description, secret, creator_id, event_types, created_at,
			last_called_at, last_success
		FROM webhooks
		WHERE $1 = ANY(event_types)
		ORDER BY created_at DESC
	`

	rows, err := r.db.QueryContext(ctx, query, eventType)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var webhooks []models.Webhook
	for rows.Next() {
		var webhook models.Webhook
		var lastCalledAt sql.NullTime
		var lastSuccess sql.NullBool
		var eventTypes []string

		err := rows.Scan(
			&webhook.ID,
			&webhook.URL,
			&webhook.Description,
			&webhook.Secret,
			&webhook.CreatorID,
			pq.Array(&eventTypes),
			&webhook.CreatedAt,
			&lastCalledAt,
			&lastSuccess,
		)
		if err != nil {
			return nil, err
		}

		webhook.EventTypes = eventTypes

		// Handle nullable fields
		if lastCalledAt.Valid {
			webhook.LastCalledAt = &lastCalledAt.Time
		}
		if lastSuccess.Valid {
			webhook.LastSuccess = &lastSuccess.Bool
		}

		webhooks = append(webhooks, webhook)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return webhooks, nil
}

// Delete removes a webhook
func (r *WebhookRepository) Delete(ctx context.Context, id uuid.UUID) error {
	query := `DELETE FROM webhooks WHERE id = $1`
	_, err := r.db.ExecContext(ctx, query, id)
	return err
}

// Ensure WebhookRepository implements repositories.WebhookRepository
var _ repositories.WebhookRepository = (*WebhookRepository)(nil)
