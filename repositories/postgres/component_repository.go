// repositories/postgres/component_repository.go
package postgres

import (
	"context"
	"database/sql"

	"github.com/google/uuid"

	"github.com/matthewmc1/buganizer/models"
	"github.com/matthewmc1/buganizer/repositories"
)

// ComponentRepository implements the ComponentRepository interface for PostgreSQL
type ComponentRepository struct {
	db *sql.DB
}

// NewComponentRepository creates a new PostgreSQL component repository
func NewComponentRepository(db *sql.DB) *ComponentRepository {
	return &ComponentRepository{
		db: db,
	}
}

// Create adds a new component to the database
func (r *ComponentRepository) Create(ctx context.Context, component *models.Component) error {
	query := `
		INSERT INTO components (
			id, name, description, owner_id, team_id, created_at, updated_at
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7
		)
	`

	_, err := r.db.ExecContext(
		ctx,
		query,
		component.ID,
		component.Name,
		component.Description,
		component.OwnerID,
		component.TeamID,
		component.CreatedAt,
		component.UpdatedAt,
	)

	return err
}

// GetByID retrieves a component by its ID
func (r *ComponentRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.Component, error) {
	query := `
		SELECT
			id, name, description, owner_id, team_id, created_at, updated_at
		FROM components
		WHERE id = $1
	`

	var component models.Component

	err := r.db.QueryRowContext(
		ctx,
		query,
		id,
	).Scan(
		&component.ID,
		&component.Name,
		&component.Description,
		&component.OwnerID,
		&component.TeamID,
		&component.CreatedAt,
		&component.UpdatedAt,
	)

	if err != nil {
		return nil, err
	}

	return &component, nil
}

// Update updates an existing component
func (r *ComponentRepository) Update(ctx context.Context, component *models.Component) error {
	query := `
		UPDATE components
		SET
			name = $1,
			description = $2,
			owner_id = $3,
			team_id = $4,
			updated_at = $5
		WHERE id = $6
	`

	_, err := r.db.ExecContext(
		ctx,
		query,
		component.Name,
		component.Description,
		component.OwnerID,
		component.TeamID,
		component.UpdatedAt,
		component.ID,
	)

	return err
}

// List retrieves components with pagination
func (r *ComponentRepository) List(ctx context.Context, limit, offset int) ([]*models.Component, int, error) {
	// Count total components
	var total int
	err := r.db.QueryRowContext(ctx, `SELECT COUNT(*) FROM components`).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	// Query components with pagination
	query := `
		SELECT
			id, name, description, owner_id, team_id, created_at, updated_at
		FROM components
		ORDER BY name
		LIMIT $1 OFFSET $2
	`

	rows, err := r.db.QueryContext(ctx, query, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var components []*models.Component
	for rows.Next() {
		var component models.Component

		err := rows.Scan(
			&component.ID,
			&component.Name,
			&component.Description,
			&component.OwnerID,
			&component.TeamID,
			&component.CreatedAt,
			&component.UpdatedAt,
		)
		if err != nil {
			return nil, 0, err
		}

		components = append(components, &component)
	}

	if err := rows.Err(); err != nil {
		return nil, 0, err
	}

	return components, total, nil
}

// GetTeamComponents gets components owned by a team
func (r *ComponentRepository) GetTeamComponents(ctx context.Context, teamID uuid.UUID) ([]*models.Component, error) {
	query := `
		SELECT
			id, name, description, owner_id, team_id, created_at, updated_at
		FROM components
		WHERE team_id = $1
		ORDER BY name
	`

	rows, err := r.db.QueryContext(ctx, query, teamID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var components []*models.Component
	for rows.Next() {
		var component models.Component

		err := rows.Scan(
			&component.ID,
			&component.Name,
			&component.Description,
			&component.OwnerID,
			&component.TeamID,
			&component.CreatedAt,
			&component.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}

		components = append(components, &component)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return components, nil
}

// Ensure ComponentRepository implements repositories.ComponentRepository
var _ repositories.ComponentRepository = (*ComponentRepository)(nil)
