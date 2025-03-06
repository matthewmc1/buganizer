// repositories/postgres/attachment_repository.go
package postgres

import (
	"context"
	"database/sql"

	"github.com/google/uuid"

	"github.com/mmcgibbon1/buganizer/models"
	"github.com/mmcgibbon1/buganizer/repositories"
)

// AttachmentRepository implements the AttachmentRepository interface for PostgreSQL
type AttachmentRepository struct {
	db *sql.DB
}

// NewAttachmentRepository creates a new PostgreSQL attachment repository
func NewAttachmentRepository(db *sql.DB) *AttachmentRepository {
	return &AttachmentRepository{
		db: db,
	}
}

// Create adds a new attachment to the database
func (r *AttachmentRepository) Create(ctx context.Context, attachment *models.Attachment) error {
	query := `
		INSERT INTO attachments (
			id, issue_id, uploader_id, filename, file_url, file_size, created_at
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7
		)
	`

	_, err := r.db.ExecContext(
		ctx,
		query,
		attachment.ID,
		attachment.IssueID,
		attachment.UploaderID,
		attachment.Filename,
		attachment.FileURL,
		attachment.FileSize,
		attachment.CreatedAt,
	)

	return err
}

// GetByID retrieves an attachment by its ID
func (r *AttachmentRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.Attachment, error) {
	query := `
		SELECT
			id, issue_id, uploader_id, filename, file_url, file_size, created_at
		FROM attachments
		WHERE id = $1
	`

	var attachment models.Attachment

	err := r.db.QueryRowContext(
		ctx,
		query,
		id,
	).Scan(
		&attachment.ID,
		&attachment.IssueID,
		&attachment.UploaderID,
		&attachment.Filename,
		&attachment.FileURL,
		&attachment.FileSize,
		&attachment.CreatedAt,
	)

	if err != nil {
		return nil, err
	}

	return &attachment, nil
}

// GetIssueAttachments retrieves all attachments for an issue
func (r *AttachmentRepository) GetIssueAttachments(ctx context.Context, issueID uuid.UUID) ([]*models.Attachment, error) {
	query := `
		SELECT
			id, issue_id, uploader_id, filename, file_url, file_size, created_at
		FROM attachments
		WHERE issue_id = $1
		ORDER BY created_at DESC
	`

	rows, err := r.db.QueryContext(ctx, query, issueID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var attachments []*models.Attachment
	for rows.Next() {
		var attachment models.Attachment

		err := rows.Scan(
			&attachment.ID,
			&attachment.IssueID,
			&attachment.UploaderID,
			&attachment.Filename,
			&attachment.FileURL,
			&attachment.FileSize,
			&attachment.CreatedAt,
		)
		if err != nil {
			return nil, err
		}

		attachments = append(attachments, &attachment)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return attachments, nil
}

// Delete removes an attachment
func (r *AttachmentRepository) Delete(ctx context.Context, id uuid.UUID) error {
	query := `DELETE FROM attachments WHERE id = $1`
	_, err := r.db.ExecContext(ctx, query, id)
	return err
}

// Ensure AttachmentRepository implements repositories.AttachmentRepository
var _ repositories.AttachmentRepository = (*AttachmentRepository)(nil)
