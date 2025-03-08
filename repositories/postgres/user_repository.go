// repositories/postgres/user_repository.go
package postgres

import (
	"context"
	"database/sql"

	"github.com/google/uuid"

	"github.com/matthewmc1/buganizer/models"
	"github.com/matthewmc1/buganizer/repositories"
)

// UserRepository implements the UserRepository interface for PostgreSQL
type UserRepository struct {
	db *sql.DB
}

// NewUserRepository creates a new PostgreSQL user repository
func NewUserRepository(db *sql.DB) *UserRepository {
	return &UserRepository{
		db: db,
	}
}

// Create adds a new user to the database
func (r *UserRepository) Create(ctx context.Context, user *models.User) error {
	query := `
		INSERT INTO users (
			id, email, name, google_id, avatar_url, created_at, updated_at
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7
		)
	`

	_, err := r.db.ExecContext(
		ctx,
		query,
		user.ID,
		user.Email,
		user.Name,
		user.GoogleID,
		user.AvatarURL,
		user.CreatedAt,
		user.UpdatedAt,
	)

	return err
}

// GetByID retrieves a user by their ID
func (r *UserRepository) GetByID(ctx context.Context, id uuid.UUID) (*models.User, error) {
	query := `
		SELECT
			id, email, name, google_id, avatar_url, created_at, updated_at
		FROM users
		WHERE id = $1
	`

	var user models.User

	err := r.db.QueryRowContext(
		ctx,
		query,
		id,
	).Scan(
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

	return &user, nil
}

// GetByEmail retrieves a user by their email
func (r *UserRepository) GetByEmail(ctx context.Context, email string) (*models.User, error) {
	query := `
		SELECT
			id, email, name, google_id, avatar_url, created_at, updated_at
		FROM users
		WHERE email = $1
	`

	var user models.User

	err := r.db.QueryRowContext(
		ctx,
		query,
		email,
	).Scan(
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

	return &user, nil
}

// GetByGoogleID retrieves a user by their Google ID
func (r *UserRepository) GetByGoogleID(ctx context.Context, googleID string) (*models.User, error) {
	query := `
		SELECT
			id, email, name, google_id, avatar_url, created_at, updated_at
		FROM users
		WHERE google_id = $1
	`

	var user models.User

	err := r.db.QueryRowContext(
		ctx,
		query,
		googleID,
	).Scan(
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

	return &user, nil
}

// Update updates an existing user
func (r *UserRepository) Update(ctx context.Context, user *models.User) error {
	query := `
		UPDATE users
		SET
			email = $1,
			name = $2,
			google_id = $3,
			avatar_url = $4,
			updated_at = $5
		WHERE id = $6
	`

	_, err := r.db.ExecContext(
		ctx,
		query,
		user.Email,
		user.Name,
		user.GoogleID,
		user.AvatarURL,
		user.UpdatedAt,
		user.ID,
	)

	return err
}

// List retrieves users with pagination
func (r *UserRepository) List(ctx context.Context, limit, offset int) ([]*models.User, int, error) {
	// Count total users
	var total int
	err := r.db.QueryRowContext(ctx, `SELECT COUNT(*) FROM users`).Scan(&total)
	if err != nil {
		return nil, 0, err
	}

	// Query users with pagination
	query := `
		SELECT
			id, email, name, google_id, avatar_url, created_at, updated_at
		FROM users
		ORDER BY name
		LIMIT $1 OFFSET $2
	`

	rows, err := r.db.QueryContext(ctx, query, limit, offset)
	if err != nil {
		return nil, 0, err
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
			return nil, 0, err
		}

		users = append(users, &user)
	}

	if err := rows.Err(); err != nil {
		return nil, 0, err
	}

	return users, total, nil
}

// IsUserInTeam checks if a user is in a team
func (r *UserRepository) IsUserInTeam(ctx context.Context, userID, teamID uuid.UUID) (bool, error) {
	query := `
		SELECT EXISTS (
			SELECT 1
			FROM team_members
			WHERE team_id = $1 AND user_id = $2
		)
	`

	var exists bool
	err := r.db.QueryRowContext(ctx, query, teamID, userID).Scan(&exists)
	return exists, err
}

// GetUserTeams gets the teams a user belongs to
func (r *UserRepository) GetUserTeams(ctx context.Context, userID uuid.UUID) ([]*models.Team, error) {
	query := `
		SELECT
			t.id, t.name, t.description, t.lead_id, t.created_at, t.updated_at
		FROM teams t
		JOIN team_members tm ON t.id = tm.team_id
		WHERE tm.user_id = $1
		ORDER BY t.name
	`

	rows, err := r.db.QueryContext(ctx, query, userID)
	if err != nil {
		return nil, err
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
			return nil, err
		}

		teams = append(teams, &team)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return teams, nil
}

// Ensure UserRepository implements repositories.UserRepository
var _ repositories.UserRepository = (*UserRepository)(nil)
