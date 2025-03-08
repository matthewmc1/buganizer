// repositories/postgres/view_repository.go
package postgres

import (
	"context"
	"database/sql"

	"github.com/google/uuid"

	"github.com/matthewmc1/buganizer/models"
	"github.com/matthewmc1/buganizer/repositories"
)

// ViewRepository implements the ViewRepository interface for PostgreSQL
type ViewRepository struct {
	db *sql.DB
}

// NewViewRepository creates a new PostgreSQL view repository
func NewViewRepository(db *sql.DB) *ViewRepository {
	return &ViewRepository{
		db: db,
	}
}

// Create adds a new saved view to the database
func (r *ViewRepository) Create(ctx context.Context, view *models.SavedView) error {
	query := `
		INSERT INTO saved_views (
			id, name, owner_id, is_team_view, team_id, query_string, created_at, updated_at
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8
		)
	`

	var teamID *uuid.UUID
	if view.TeamID != nil {
		teamID = view.TeamID
	}

	_, err := r.db.ExecContext(
		ctx,
		query,
		view.ID,
		view.Name,
		view.OwnerID,
		view.IsTeamView,
		teamID,
		view.QueryString,
		view.CreatedAt,
		view.UpdatedAt,
	)

	return err
}

// GetByID retrieves a saved view by its ID
func (r *ViewRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.SavedView, error) {
	query := `
		SELECT
			id, name, owner_id, is_team_view, team_id, query_string, created_at, updated_at
		FROM saved_views
		WHERE id = $1
	`

	var view models.SavedView
	var teamID sql.NullString

	err := r.db.QueryRowContext(
		ctx,
		query,
		id,
	).Scan(
		&view.ID,
		&view.Name,
		&view.OwnerID,
		&view.IsTeamView,
		&teamID,
		&view.QueryString,
		&view.CreatedAt,
		&view.UpdatedAt,
	)

	if err != nil {
		return nil, err
	}

	// Handle optional field
	if teamID.Valid {
		id, err := uuid.Parse(teamID.String)
		if err == nil {
			view.TeamID = &id
		}
	}

	return &view, nil
}

// Update updates an existing saved view
func (r *ViewRepository) Update(ctx context.Context, view *models.SavedView) error {
	query := `
		UPDATE saved_views
		SET
			name = $1,
			is_team_view = $2,
			team_id = $3,
			query_string = $4,
			updated_at = $5
		WHERE id = $6
	`

	var teamID *uuid.UUID
	if view.TeamID != nil {
		teamID = view.TeamID
	}

	_, err := r.db.ExecContext(
		ctx,
		query,
		view.Name,
		view.IsTeamView,
		teamID,
		view.QueryString,
		view.UpdatedAt,
		view.ID,
	)

	return err
}

// ListUserViews retrieves saved views for a user (both personal and team views)
func (r *ViewRepository) ListUserViews(ctx context.Context, userID uuid.UUID, teamID string) ([]*models.SavedView, error) {
	var query string
	var args []interface{}

	if teamID != "" {
		// If teamID is provided, get only team views for that team
		query = `
			SELECT
				id, name, owner_id, is_team_view, team_id, query_string, created_at, updated_at
			FROM saved_views
			WHERE team_id = $1
			ORDER BY name
		`
		args = []interface{}{teamID}
	} else {
		// Otherwise get personal views and team views for teams the user belongs to
		query = `
			SELECT
				sv.id, sv.name, sv.owner_id, sv.is_team_view, sv.team_id, sv.query_string, sv.created_at, sv.updated_at
			FROM saved_views sv
			LEFT JOIN team_members tm ON sv.team_id = tm.team_id
			WHERE sv.owner_id = $1
			OR (sv.is_team_view = true AND tm.user_id = $1)
			ORDER BY sv.name
		`
		args = []interface{}{userID}
	}

	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var views []*models.SavedView
	for rows.Next() {
		var view models.SavedView
		var teamID sql.NullString

		err := rows.Scan(
			&view.ID,
			&view.Name,
			&view.OwnerID,
			&view.IsTeamView,
			&teamID,
			&view.QueryString,
			&view.CreatedAt,
			&view.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}

		// Handle optional field
		if teamID.Valid {
			id, err := uuid.Parse(teamID.String)
			if err == nil {
				view.TeamID = &id
			}
		}

		views = append(views, &view)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return views, nil
}

// ListTeamViews retrieves saved views for a team
func (r *ViewRepository) ListTeamViews(ctx context.Context, teamID uuid.UUID) ([]*models.SavedView, error) {
	query := `
		SELECT
			id, name, owner_id, is_team_view, team_id, query_string, created_at, updated_at
		FROM saved_views
		WHERE team_id = $1
		ORDER BY name
	`

	rows, err := r.db.QueryContext(ctx, query, teamID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var views []*models.SavedView
	for rows.Next() {
		var view models.SavedView
		var teamID sql.NullString

		err := rows.Scan(
			&view.ID,
			&view.Name,
			&view.OwnerID,
			&view.IsTeamView,
			&teamID,
			&view.QueryString,
			&view.CreatedAt,
			&view.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}

		// Handle optional field
		if teamID.Valid {
			id, err := uuid.Parse(teamID.String)
			if err == nil {
				view.TeamID = &id
			}
		}

		views = append(views, &view)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return views, nil
}

// Delete removes a saved view
func (r *ViewRepository) Delete(ctx context.Context, id uuid.UUID) error {
	query := `DELETE FROM saved_views WHERE id = $1`
	_, err := r.db.ExecContext(ctx, query, id)
	return err
}

// Ensure ViewRepository implements repositories.ViewRepository
var _ repositories.ViewRepository = (*ViewRepository)(nil)
