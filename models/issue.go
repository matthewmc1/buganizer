// models/issue.go
package models

import (
	"time"

	"github.com/google/uuid"
)

// Priority levels for issues
type Priority string

const (
	PriorityP0 Priority = "P0" // Critical - immediate action required
	PriorityP1 Priority = "P1" // High - resolve within 24 hours
	PriorityP2 Priority = "P2" // Medium - resolve within 3 days
	PriorityP3 Priority = "P3" // Low - resolve within 1 week
	PriorityP4 Priority = "P4" // Trivial - no specific timeline
)

// Severity levels for issues
type Severity string

const (
	SeverityS0 Severity = "S0" // Critical - system down
	SeverityS1 Severity = "S1" // Major - significant impact
	SeverityS2 Severity = "S2" // Moderate - partial functionality affected
	SeverityS3 Severity = "S3" // Minor - edge case or cosmetic issue
)

// Status represents the current state of an issue
type Status string

const (
	StatusNew        Status = "New"
	StatusAssigned   Status = "Assigned"
	StatusInProgress Status = "In Progress"
	StatusFixed      Status = "Fixed"
	StatusVerified   Status = "Verified"
	StatusClosed     Status = "Closed"
	StatusDuplicate  Status = "Duplicate"
	StatusWontFix    Status = "Won't Fix"
)

// Component represents a specific part of the system
type Component struct {
	ID          uuid.UUID `json:"id" db:"id"`
	Name        string    `json:"name" db:"name"`
	Description string    `json:"description" db:"description"`
	OwnerID     uuid.UUID `json:"owner_id" db:"owner_id"`
	TeamID      uuid.UUID `json:"team_id" db:"team_id"`
	CreatedAt   time.Time `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time `json:"updated_at" db:"updated_at"`
}

// Issue represents a bug or feature request
type Issue struct {
	ID             uuid.UUID  `json:"id" db:"id"`
	Title          string     `json:"title" db:"title"`
	Description    string     `json:"description" db:"description"`
	ReproduceSteps string     `json:"reproduce_steps" db:"reproduce_steps"`
	ComponentID    uuid.UUID  `json:"component_id" db:"component_id"`
	ReporterID     uuid.UUID  `json:"reporter_id" db:"reporter_id"`
	AssigneeID     *uuid.UUID `json:"assignee_id" db:"assignee_id"`
	Priority       Priority   `json:"priority" db:"priority"`
	Severity       Severity   `json:"severity" db:"severity"`
	Status         Status     `json:"status" db:"status"`
	DueDate        *time.Time `json:"due_date" db:"due_date"` // Based on SLA
	CreatedAt      time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt      time.Time  `json:"updated_at" db:"updated_at"`
	Labels         []string   `json:"labels" db:"labels"`
}

// Comment represents a comment on an issue
type Comment struct {
	ID        uuid.UUID `json:"id" db:"id"`
	IssueID   uuid.UUID `json:"issue_id" db:"issue_id"`
	AuthorID  uuid.UUID `json:"author_id" db:"author_id"`
	Content   string    `json:"content" db:"content"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
	UpdatedAt time.Time `json:"updated_at" db:"updated_at"`
}

// Attachment represents a file attached to an issue
type Attachment struct {
	ID         uuid.UUID `json:"id" db:"id"`
	IssueID    uuid.UUID `json:"issue_id" db:"issue_id"`
	UploaderID uuid.UUID `json:"uploader_id" db:"uploader_id"`
	Filename   string    `json:"filename" db:"filename"`
	FileURL    string    `json:"file_url" db:"file_url"`
	FileSize   int64     `json:"file_size" db:"file_size"`
	CreatedAt  time.Time `json:"created_at" db:"created_at"`
}

// User represents a system user
type User struct {
	ID        uuid.UUID `json:"id" db:"id"`
	Email     string    `json:"email" db:"email"`
	Name      string    `json:"name" db:"name"`
	GoogleID  string    `json:"google_id" db:"google_id"`
	AvatarURL string    `json:"avatar_url" db:"avatar_url"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
	UpdatedAt time.Time `json:"updated_at" db:"updated_at"`
}

// Team represents a group of users
type Team struct {
	ID          uuid.UUID `json:"id" db:"id"`
	Name        string    `json:"name" db:"name"`
	Description string    `json:"description" db:"description"`
	LeadID      uuid.UUID `json:"lead_id" db:"lead_id"`
	CreatedAt   time.Time `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time `json:"updated_at" db:"updated_at"`
}

// SavedView represents a saved search filter
type SavedView struct {
	ID          uuid.UUID  `json:"id" db:"id"`
	Name        string     `json:"name" db:"name"`
	OwnerID     uuid.UUID  `json:"owner_id" db:"owner_id"`
	IsTeamView  bool       `json:"is_team_view" db:"is_team_view"`
	TeamID      *uuid.UUID `json:"team_id" db:"team_id"`
	QueryString string     `json:"query_string" db:"query_string"`
	CreatedAt   time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at" db:"updated_at"`
}
