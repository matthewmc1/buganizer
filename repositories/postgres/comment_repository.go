// repositories/postgres/comment_repository.go
package postgres

import (
	"context"
	"database/sql"

	"github.com/google/uuid"

	"github.com/matthewmc1/buganizer/models"
	"github.com/matthewmc1/buganizer/repositories"
)

// CommentRepository implements the CommentRepository interface for PostgreSQL
type CommentRepository struct {
	db *sql.DB
}

// NewCommentRepository creates a new PostgreSQL comment repository
func NewCommentRepository(db *sql.DB) *CommentRepository {
	return &CommentRepository{
		db: db,
	}
}

// Create adds a new comment to the database
func (r *CommentRepository) Create(ctx context.Context, comment *models.Comment) error {
	query := `
		INSERT INTO comments (
			id, issue_id, author_id, content, created_at, updated_at
		) VALUES (
			$1, $2, $3, $4, $5, $6
		)
	`

	_, err := r.db.ExecContext(
		ctx,
		query,
		comment.ID,
		comment.IssueID,
		comment.AuthorID,
		comment.Content,
		comment.CreatedAt,
		comment.UpdatedAt,
	)

	return err
}

// GetByID retrieves a comment by its ID
func (r *CommentRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.Comment, error) {
	query := `
		SELECT
			id, issue_id, author_id, content, created_at, updated_at
		FROM comments
		WHERE id = $1
	`

	var comment models.Comment

	err := r.db.QueryRowContext(
		ctx,
		query,
		id,
	).Scan(
		&comment.ID,
		&comment.IssueID,
		&comment.AuthorID,
		&comment.Content,
		&comment.CreatedAt,
		&comment.UpdatedAt,
	)

	if err != nil {
		return nil, err
	}

	return &comment, nil
}

// Update updates an existing comment
func (r *CommentRepository) Update(ctx context.Context, comment *models.Comment) error {
	query := `
		UPDATE comments
		SET
			content = $1,
			updated_at = $2
		WHERE id = $3
	`

	_, err := r.db.ExecContext(
		ctx,
		query,
		comment.Content,
		comment.UpdatedAt,
		comment.ID,
	)

	return err
}

// GetIssueComments retrieves all comments for an issue
func (r *CommentRepository) GetIssueComments(ctx context.Context, issueID uuid.UUID) ([]*models.Comment, error) {
	query := `
		SELECT
			id, issue_id, author_id, content, created_at, updated_at
		FROM comments
		WHERE issue_id = $1
		ORDER BY created_at ASC
	`

	rows, err := r.db.QueryContext(ctx, query, issueID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var comments []*models.Comment
	for rows.Next() {
		var comment models.Comment

		err := rows.Scan(
			&comment.ID,
			&comment.IssueID,
			&comment.AuthorID,
			&comment.Content,
			&comment.CreatedAt,
			&comment.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}

		comments = append(comments, &comment)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return comments, nil
}

// Delete removes a comment
func (r *CommentRepository) Delete(ctx context.Context, id uuid.UUID) error {
	query := `DELETE FROM comments WHERE id = $1`
	_, err := r.db.ExecContext(ctx, query, id)
	return err
}

// Ensure CommentRepository implements repositories.CommentRepository
var _ repositories.CommentRepository = (*CommentRepository)(nil)
