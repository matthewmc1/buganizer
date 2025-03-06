// repositories/interfaces.go
package repositories

import (
	"context"
	"time"

	"github.com/google/uuid"

	"github.com/matthewmc1/buganizer/models"
)

// IssueRepository defines the interface for issue data operations
type IssueRepository interface {
	// Create adds a new issue to the database
	Create(ctx context.Context, issue *models.Issue) error

	// GetByID retrieves an issue by its ID
	GetByID(ctx context.Context, id uuid.UUID) (*models.Issue, error)

	// Update updates an existing issue
	Update(ctx context.Context, issue *models.Issue) error

	// List retrieves issues with filtering, pagination
	// filter is a search query like "is:open assignee:me component:frontend"
	List(ctx context.Context, filter string, limit, offset int) ([]*models.Issue, int, error)

	// GetComponentIssues retrieves issues for a specific component
	GetComponentIssues(ctx context.Context, componentID uuid.UUID, limit, offset int) ([]*models.Issue, int, error)

	// GetAssigneeIssues retrieves issues assigned to a specific user
	GetAssigneeIssues(ctx context.Context, assigneeID uuid.UUID, limit, offset int) ([]*models.Issue, int, error)

	// GetByStatus retrieves issues with a specific status
	GetByStatus(ctx context.Context, status models.Status, limit, offset int) ([]*models.Issue, int, error)

	// Delete removes an issue (soft delete in practice)
	Delete(ctx context.Context, id uuid.UUID) error
}

// CommentRepository defines the interface for comment data operations
type CommentRepository interface {
	// Create adds a new comment to the database
	Create(ctx context.Context, comment *models.Comment) error

	// GetByID retrieves a comment by its ID
	GetByID(ctx context.Context, id uuid.UUID) (*models.Comment, error)

	// Update updates an existing comment
	Update(ctx context.Context, comment *models.Comment) error

	// GetIssueComments retrieves all comments for an issue
	GetIssueComments(ctx context.Context, issueID uuid.UUID) ([]*models.Comment, error)

	// Delete removes a comment
	Delete(ctx context.Context, id uuid.UUID) error
}

// AttachmentRepository defines the interface for attachment data operations
type AttachmentRepository interface {
	// Create adds a new attachment to the database
	Create(ctx context.Context, attachment *models.Attachment) error

	// GetByID retrieves an attachment by its ID
	GetByID(ctx context.Context, id uuid.UUID) (*models.Attachment, error)

	// GetIssueAttachments retrieves all attachments for an issue
	GetIssueAttachments(ctx context.Context, issueID uuid.UUID) ([]*models.Attachment, error)

	// Delete removes an attachment
	Delete(ctx context.Context, id uuid.UUID) error
}

// UserRepository defines the interface for user data operations
type UserRepository interface {
	// Create adds a new user to the database
	Create(ctx context.Context, user *models.User) error

	// GetByID retrieves a user by their ID
	GetByID(ctx context.Context, id uuid.UUID) (*models.User, error)

	// GetByEmail retrieves a user by their email
	GetByEmail(ctx context.Context, email string) (*models.User, error)

	// GetByGoogleID retrieves a user by their Google ID
	GetByGoogleID(ctx context.Context, googleID string) (*models.User, error)

	// Update updates an existing user
	Update(ctx context.Context, user *models.User) error

	// List retrieves users with pagination
	List(ctx context.Context, limit, offset int) ([]*models.User, int, error)

	// IsUserInTeam checks if a user is in a team
	IsUserInTeam(ctx context.Context, userID, teamID uuid.UUID) (bool, error)

	// GetUserTeams gets the teams a user belongs to
	GetUserTeams(ctx context.Context, userID uuid.UUID) ([]*models.Team, error)
}

// TeamRepository defines the interface for team data operations
type TeamRepository interface {
	// Create adds a new team to the database
	Create(ctx context.Context, team *models.Team) error

	// GetByID retrieves a team by its ID
	GetByID(ctx context.Context, id uuid.UUID) (*models.Team, error)

	// Update updates an existing team
	Update(ctx context.Context, team *models.Team) error

	// List retrieves teams with pagination
	List(ctx context.Context, limit, offset int) ([]*models.Team, int, error)

	// GetTeamMembers gets the members of a team
	GetTeamMembers(ctx context.Context, teamID uuid.UUID) ([]*models.User, error)

	// AddMember adds a user to a team
	AddMember(ctx context.Context, teamID, userID uuid.UUID) error

	// RemoveMember removes a user from a team
	RemoveMember(ctx context.Context, teamID, userID uuid.UUID) error
}

// ComponentRepository defines the interface for component data operations
type ComponentRepository interface {
	// Create adds a new component to the database
	Create(ctx context.Context, component *models.Component) error

	// GetByID retrieves a component by its ID
	GetByID(ctx context.Context, id uuid.UUID) (*models.Component, error)

	// Update updates an existing component
	Update(ctx context.Context, component *models.Component) error

	// List retrieves components with pagination
	List(ctx context.Context, limit, offset int) ([]*models.Component, int, error)

	// GetTeamComponents gets components owned by a team
	GetTeamComponents(ctx context.Context, teamID uuid.UUID) ([]*models.Component, error)
}

// ViewRepository defines the interface for saved view data operations
type ViewRepository interface {
	// Create adds a new saved view to the database
	Create(ctx context.Context, view *models.SavedView) error

	// GetByID retrieves a saved view by its ID
	GetByID(ctx context.Context, id uuid.UUID) (*models.SavedView, error)

	// Update updates an existing saved view
	Update(ctx context.Context, view *models.SavedView) error

	// ListUserViews retrieves saved views for a user (both personal and team views)
	ListUserViews(ctx context.Context, userID uuid.UUID, teamID string) ([]*models.SavedView, error)

	// ListTeamViews retrieves saved views for a team
	ListTeamViews(ctx context.Context, teamID uuid.UUID) ([]*models.SavedView, error)

	// Delete removes a saved view
	Delete(ctx context.Context, id uuid.UUID) error
}

// WebhookRepository defines the interface for webhook data operations
type WebhookRepository interface {
	// Create adds a new webhook to the database
	Create(ctx context.Context, webhook *models.Webhook) error

	// GetByID retrieves a webhook by its ID
	GetByID(ctx context.Context, id uuid.UUID) (*models.Webhook, error)

	// Update updates an existing webhook
	Update(ctx context.Context, webhook *models.Webhook) error

	// UpdateStatus updates the last called time and success status of a webhook
	UpdateStatus(ctx context.Context, id uuid.UUID, lastCalledAt *time.Time, success bool) error

	// ListByEventType lists webhooks subscribed to a specific event type
	ListByEventType(ctx context.Context, eventType string) ([]models.Webhook, error)

	// Delete removes a webhook
	Delete(ctx context.Context, id uuid.UUID) error
}

// NotificationPreferenceRepository defines the interface for notification preference data operations
type NotificationPreferenceRepository interface {
	// Upsert creates or updates notification preferences for a user
	Upsert(ctx context.Context, pref *models.NotificationPreference) error

	// GetByUserID retrieves notification preferences for a user
	GetByUserID(ctx context.Context, userID uuid.UUID) (*models.NotificationPreference, error)
}
