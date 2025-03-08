// repositories/postgres/issue_repository.go
package postgres

import (
	"context"
	"database/sql"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/lib/pq"

	"github.com/matthewmc1/buganizer/models"
	"github.com/matthewmc1/buganizer/repositories"
)

// IssueRepository implements the IssueRepository interface for PostgreSQL
type IssueRepository struct {
	db *sql.DB
}

// NewIssueRepository creates a new PostgreSQL issue repository
func NewIssueRepository(db *sql.DB) *IssueRepository {
	return &IssueRepository{
		db: db,
	}
}

// Create adds a new issue to the database
func (r *IssueRepository) Create(ctx context.Context, issue *models.Issue) error {
	query := `
		INSERT INTO issues (
			id, title, description, reproduce_steps, component_id, reporter_id, assignee_id,
			priority, severity, status, due_date, created_at, updated_at, labels
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
		)
	`

	var assigneeID *uuid.UUID
	if issue.AssigneeID != nil {
		assigneeID = issue.AssigneeID
	}

	_, err := r.db.ExecContext(
		ctx,
		query,
		issue.ID,
		issue.Title,
		issue.Description,
		issue.ReproduceSteps,
		issue.ComponentID,
		issue.ReporterID,
		assigneeID,
		issue.Priority,
		issue.Severity,
		issue.Status,
		issue.DueDate,
		issue.CreatedAt,
		issue.UpdatedAt,
		pq.Array(issue.Labels),
	)

	return err
}

// GetByID retrieves an issue by its ID
func (r *IssueRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.Issue, error) {
	query := `
		SELECT
			id, title, description, reproduce_steps, component_id, reporter_id, assignee_id,
			priority, severity, status, due_date, created_at, updated_at, labels
		FROM issues
		WHERE id = $1
	`

	var issue models.Issue
	var assigneeID sql.NullString
	var dueDate sql.NullTime
	var labels []string

	err := r.db.QueryRowContext(
		ctx,
		query,
		id,
	).Scan(
		&issue.ID,
		&issue.Title,
		&issue.Description,
		&issue.ReproduceSteps,
		&issue.ComponentID,
		&issue.ReporterID,
		&assigneeID,
		&issue.Priority,
		&issue.Severity,
		&issue.Status,
		&dueDate,
		&issue.CreatedAt,
		&issue.UpdatedAt,
		pq.Array(&labels),
	)

	if err != nil {
		return nil, err
	}

	// Handle optional fields
	if assigneeID.Valid {
		id, err := uuid.Parse(assigneeID.String)
		if err == nil {
			issue.AssigneeID = &id
		}
	}

	if dueDate.Valid {
		issue.DueDate = &dueDate.Time
	}

	issue.Labels = labels

	return &issue, nil
}

// Update updates an existing issue
func (r *IssueRepository) Update(ctx context.Context, issue *models.Issue) error {
	query := `
		UPDATE issues
		SET
			title = $1,
			description = $2,
			reproduce_steps = $3,
			component_id = $4,
			assignee_id = $5,
			priority = $6,
			severity = $7,
			status = $8,
			due_date = $9,
			updated_at = $10,
			labels = $11
		WHERE id = $12
	`

	var assigneeID *uuid.UUID
	if issue.AssigneeID != nil {
		assigneeID = issue.AssigneeID
	}

	_, err := r.db.ExecContext(
		ctx,
		query,
		issue.Title,
		issue.Description,
		issue.ReproduceSteps,
		issue.ComponentID,
		assigneeID,
		issue.Priority,
		issue.Severity,
		issue.Status,
		issue.DueDate,
		issue.UpdatedAt,
		pq.Array(issue.Labels),
		issue.ID,
	)

	return err
}

// List retrieves issues with filtering, pagination
func (r *IssueRepository) List(ctx context.Context, filter string, limit, offset int) ([]*models.Issue, int, error) {
	// Parse filter and build WHERE clause
	whereClause, args := r.buildWhereClause(filter)

	// Count total results (for pagination)
	countQuery := fmt.Sprintf(`
		SELECT COUNT(*) FROM issues
		%s
	`, whereClause)

	var total int
	err := r.db.QueryRowContext(ctx, countQuery, args...).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	// Query with pagination
	query := fmt.Sprintf(`
		SELECT
			id, title, description, reproduce_steps, component_id, reporter_id, assignee_id,
			priority, severity, status, due_date, created_at, updated_at, labels
		FROM issues
		%s
		ORDER BY created_at DESC
		LIMIT $%d OFFSET $%d
	`, whereClause, len(args)+1, len(args)+2)

	// Add limit and offset to args
	args = append(args, limit, offset)

	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	// Parse results
	var issues []*models.Issue
	for rows.Next() {
		var issue models.Issue
		var assigneeID sql.NullString
		var dueDate sql.NullTime
		var labels []string

		err := rows.Scan(
			&issue.ID,
			&issue.Title,
			&issue.Description,
			&issue.ReproduceSteps,
			&issue.ComponentID,
			&issue.ReporterID,
			&assigneeID,
			&issue.Priority,
			&issue.Severity,
			&issue.Status,
			&dueDate,
			&issue.CreatedAt,
			&issue.UpdatedAt,
			pq.Array(&labels),
		)
		if err != nil {
			return nil, 0, err
		}

		// Handle optional fields
		if assigneeID.Valid {
			id, err := uuid.Parse(assigneeID.String)
			if err == nil {
				issue.AssigneeID = &id
			}
		}

		if dueDate.Valid {
			issue.DueDate = &dueDate.Time
		}

		issue.Labels = labels

		issues = append(issues, &issue)
	}

	if err := rows.Err(); err != nil {
		return nil, 0, err
	}

	return issues, total, nil
}

// GetComponentIssues retrieves issues for a specific component
func (r *IssueRepository) GetComponentIssues(ctx context.Context, componentID uuid.UUID, limit, offset int) ([]*models.Issue, int, error) {
	filter := fmt.Sprintf("component:%s", componentID.String())
	return r.List(ctx, filter, limit, offset)
}

// GetAssigneeIssues retrieves issues assigned to a specific user
func (r *IssueRepository) GetAssigneeIssues(ctx context.Context, assigneeID uuid.UUID, limit, offset int) ([]*models.Issue, int, error) {
	filter := fmt.Sprintf("assignee:%s", assigneeID.String())
	return r.List(ctx, filter, limit, offset)
}

// GetByStatus retrieves issues with a specific status
func (r *IssueRepository) GetByStatus(ctx context.Context, status models.Status, limit, offset int) ([]*models.Issue, int, error) {
	filter := fmt.Sprintf("status:%s", status)
	return r.List(ctx, filter, limit, offset)
}

// Delete removes an issue
func (r *IssueRepository) Delete(ctx context.Context, id uuid.UUID) error {
	query := `DELETE FROM issues WHERE id = $1`
	_, err := r.db.ExecContext(ctx, query, id)
	return err
}

// buildWhereClause converts the filter string into a SQL WHERE clause
func (r *IssueRepository) buildWhereClause(filter string) (string, []interface{}) {
	if filter == "" {
		return "", []interface{}{}
	}

	var conditions []string
	var args []interface{}
	argIndex := 1

	// Parse the filter string
	tokens := strings.Fields(filter)
	for _, token := range tokens {
		if strings.Contains(token, ":") {
			parts := strings.SplitN(token, ":", 2)
			key := parts[0]
			value := parts[1]

			switch key {
			case "is":
				// Handle status shortcuts like is:open, is:closed
				if value == "open" {
					conditions = append(conditions, fmt.Sprintf("status != $%d", argIndex))
					args = append(args, string(models.StatusClosed))
					argIndex++
				} else if value == "closed" {
					conditions = append(conditions, fmt.Sprintf("status = $%d", argIndex))
					args = append(args, string(models.StatusClosed))
					argIndex++
				}
			case "status":
				conditions = append(conditions, fmt.Sprintf("status = $%d", argIndex))
				args = append(args, value)
				argIndex++
			case "priority":
				conditions = append(conditions, fmt.Sprintf("priority = $%d", argIndex))
				args = append(args, value)
				argIndex++
			case "severity":
				conditions = append(conditions, fmt.Sprintf("severity = $%d", argIndex))
				args = append(args, value)
				argIndex++
			case "component":
				// Try to parse as UUID first
				_, err := uuid.Parse(value)
				if err == nil {
					conditions = append(conditions, fmt.Sprintf("component_id = $%d", argIndex))
					args = append(args, value)
					argIndex++
				} else {
					// If not UUID, would join with components table to search by name
					// For simplicity, we'll just return no results for non-UUID component IDs
					conditions = append(conditions, "1 = 0") // Always false
				}
			case "assignee":
				if value == "me" {
					// This requires the user ID from context, which we don't have here
					// We'll handle this at the service level
					conditions = append(conditions, "assignee_id IS NOT NULL")
				} else if value == "none" || value == "unassigned" {
					conditions = append(conditions, "assignee_id IS NULL")
				} else {
					// Try to parse as UUID
					_, err := uuid.Parse(value)
					if err == nil {
						conditions = append(conditions, fmt.Sprintf("assignee_id = $%d", argIndex))
						args = append(args, value)
						argIndex++
					} else {
						// If not UUID, would join with users table to search by name or email
						// For simplicity, we'll just return no results for non-UUID assignee IDs
						conditions = append(conditions, "1 = 0") // Always false
					}
				}
			case "reporter":
				// Try to parse as UUID
				_, err := uuid.Parse(value)
				if err == nil {
					conditions = append(conditions, fmt.Sprintf("reporter_id = $%d", argIndex))
					args = append(args, value)
					argIndex++
				} else {
					// If not UUID, would join with users table to search by name or email
					conditions = append(conditions, "1 = 0") // Always false
				}
			case "team":
				// This requires joining with components and teams tables
				// For simplicity, we'll just return no results for team filters
				conditions = append(conditions, "1 = 0") // Always false
			case "label":
				conditions = append(conditions, fmt.Sprintf("$%d = ANY(labels)", argIndex))
				args = append(args, value)
				argIndex++
			case "after", "created_after":
				// Try to parse as date
				t, err := time.Parse("2006-01-02", value)
				if err == nil {
					conditions = append(conditions, fmt.Sprintf("created_at >= $%d", argIndex))
					args = append(args, t)
					argIndex++
				}
			case "before", "created_before":
				// Try to parse as date
				t, err := time.Parse("2006-01-02", value)
				if err == nil {
					conditions = append(conditions, fmt.Sprintf("created_at <= $%d", argIndex))
					args = append(args, t)
					argIndex++
				}
			case "due_before":
				// Try to parse as date
				t, err := time.Parse("2006-01-02", value)
				if err == nil {
					conditions = append(conditions, fmt.Sprintf("due_date <= $%d", argIndex))
					args = append(args, t)
					argIndex++
				}
			case "due_after":
				// Try to parse as date
				t, err := time.Parse("2006-01-02", value)
				if err == nil {
					conditions = append(conditions, fmt.Sprintf("due_date >= $%d", argIndex))
					args = append(args, t)
					argIndex++
				}
			}
		} else {
			// Free text search
			conditions = append(conditions, fmt.Sprintf("(title ILIKE $%d OR description ILIKE $%d)", argIndex, argIndex))
			args = append(args, "%"+token+"%")
			argIndex++
		}
	}

	if len(conditions) > 0 {
		return "WHERE " + strings.Join(conditions, " AND "), args
	}

	return "", []interface{}{}
}

// Ensure IssueRepository implements repositories.IssueRepository
var _ repositories.IssueRepository = (*IssueRepository)(nil)
