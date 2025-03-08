// repositories/postgres/team_repository.go
package postgres

import (
	"context"
	"database/sql"

	"github.com/google/uuid"

	"github.com/matthewmc1/buganizer/models"
	"github.com/matthewmc1/buganizer/repositories"
)

// TeamRepository implements the TeamRepository interface for PostgreSQL
type TeamRepository struct {
	db *sql.DB
}

// NewTeamRepository creates a new PostgreSQL team repository
func NewTeamRepository(db *sql.DB) *TeamRepository {
	return &TeamRepository{
		db: db,
	}
}

// Create adds a new team to the database
func (r *TeamRepository) Create(ctx context.Context, team *models.Team) error {
	query := `
		INSERT INTO teams (
			id, name, description, lead_id, created_at, updated_at
		) VALUES (
			$1, $2, $3, $4, $5, $6
		)
	`

	_, err := r.db.ExecContext(
		ctx,
		query,
		team.ID,
		team.Name,
		team.Description,
		team.LeadID,
		team.CreatedAt,
		team.UpdatedAt,
	)

	return err
}

// GetByID retrieves a team by its ID
func (r *TeamRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.Team, error) {
	query := `
		SELECT
			id, name, description, lead_id, created_at, updated_at
		FROM teams
		WHERE id = $1
	`

	var team models.Team

	err := r.db.QueryRowContext(
		ctx,
		query,
		id,
	).Scan(
		&team.ID,
		&team.Name,
		&team.Description,
		&team.LeadID,
		&team.CreatedAt,
		&team.UpdatedAt,
	)

	if err != nil {
		return nil, err
	}

	return &team, nil
}

// Update updates an existing team
func (r *TeamRepository) Update(ctx context.Context, team *models.Team) error {
	query := `
		UPDATE teams
		SET
			name = $1,
			description = $2,
			lead_id = $3,
			updated_at = $4
		WHERE id = $5
	`

	_, err := r.db.ExecContext(
		ctx,
		query,
		team.Name,
		team.Description,
		team.LeadID,
		team.UpdatedAt,
		team.ID,
	)

	return err
}

// List retrieves teams with pagination
func (r *TeamRepository) List(ctx context.Context, limit, offset int) ([]*models.Team, int, error) {
	// Count total teams
	var total int
	err := r.db.QueryRowContext(ctx, `SELECT COUNT(*) FROM teams`).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	// Query teams with pagination
	query := `
		SELECT
			id, name, description, lead_id, created_at, updated_at
		FROM teams
		ORDER BY name
		LIMIT $1 OFFSET $2
	`

	rows, err := r.db.QueryContext(ctx, query, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var teams []*models.Team
	for rows.Next() {
		var team models.Team

		err := rows.Scan(
			&team.ID,
			&team.Name,
			&team.Description,
			&team.LeadID,
			&team.CreatedAt,
			&team.UpdatedAt,
		)
		if err != nil {
			return nil, 0, err
		}

		teams = append(teams, &team)
	}

	if err := rows.Err(); err != nil {
		return nil, 0, err
	}

	return teams, total, nil
}

// GetTeamMembers gets the members of a team
func (r *TeamRepository) GetTeamMembers(ctx context.Context, teamID uuid.UUID) ([]*models.User, error) {
	query := `
		SELECT
			u.id, u.email, u.name, u.google_id, u.avatar_url, u.created_at, u.updated_at
		FROM users u
		JOIN team_members tm ON u.id = tm.user_id
		WHERE tm.team_id = $1
		ORDER BY u.name
	`

	rows, err := r.db.QueryContext(ctx, query, teamID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []*models.User
	for rows.Next() {
		var user models.User

		err := rows.Scan(
			&user.ID,
			&user.Email,
			&user.Name,
			&user.GoogleID,
			&user.AvatarURL,
			&user.CreatedAt,
			&user.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}

		users = append(users, &user)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return users, nil
}

// AddMember adds a user to a team
func (r *TeamRepository) AddMember(ctx context.Context, teamID, userID uuid.UUID) error {
	query := `
		INSERT INTO team_members (team_id, user_id)
		VALUES ($1, $2)
		ON CONFLICT (team_id, user_id) DO NOTHING
	`

	_, err := r.db.ExecContext(ctx, query, teamID, userID)
	return err
}

// RemoveMember removes a user from a team
func (r *TeamRepository) RemoveMember(ctx context.Context, teamID, userID uuid.UUID) error {
	query := `
		DELETE FROM team_members
		WHERE team_id = $1 AND user_id = $2
	`

	_, err := r.db.ExecContext(ctx, query, teamID, userID)
	return err
}

// Ensure TeamRepository implements repositories.TeamRepository
var _ repositories.TeamRepository = (*TeamRepository)(nil)
