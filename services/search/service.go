// services/search/service.go
package search

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"github.com/google/uuid"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/types/known/timestamppb"

	"github.com/matthewmc1/buganizer/models"
	pb "github.com/matthewmc1/buganizer/proto"
	"github.com/matthewmc1/buganizer/repositories"
)

// Service implements the SearchService gRPC interface
type Service struct {
	pb.UnimplementedSearchServiceServer
	issueRepo repositories.IssueRepository
	viewRepo  repositories.ViewRepository
	userRepo  repositories.UserRepository
}

// NewService creates a new search service
func NewService(
	issueRepo repositories.IssueRepository,
	viewRepo repositories.ViewRepository,
	userRepo repositories.UserRepository,
) *Service {
	return &Service{
		issueRepo: issueRepo,
		viewRepo:  viewRepo,
		userRepo:  userRepo,
	}
}

// SearchIssues searches issues with complex queries
func (s *Service) SearchIssues(ctx context.Context, req *pb.SearchRequest) (*pb.SearchResponse, error) {
	if req.Query == "" {
		return nil, status.Error(codes.InvalidArgument, "query is required")
	}

	pageSize := 50
	if req.PageSize > 0 {
		pageSize = int(req.PageSize)
	}

	// Parse the page token (offset)
	offset := 0
	if req.PageToken != "" {
		fmt.Sscanf(req.PageToken, "%d", &offset)
	}

	// Query issues with the search query
	issues, total, err := s.issueRepo.List(ctx, req.Query, pageSize, offset)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to search issues: %v", err)
	}

	// Convert to protobuf response
	response := &pb.SearchResponse{
		Issues:       make([]*pb.Issue, len(issues)),
		TotalResults: int32(total),
	}

	for i, issue := range issues {
		response.Issues[i] = s.modelToProto(issue)
	}

	// Set next page token if there are more results
	if offset+len(issues) < total {
		response.NextPageToken = fmt.Sprintf("%d", offset+len(issues))
	}

	return response, nil
}

// SaveView saves a search query as a named view
func (s *Service) SaveView(ctx context.Context, req *pb.SaveViewRequest) (*pb.SavedView, error) {
	if req.Name == "" {
		return nil, status.Error(codes.InvalidArgument, "view name is required")
	}
	if req.QueryString == "" {
		return nil, status.Error(codes.InvalidArgument, "query string is required")
	}

	// Get user ID from context
	userID, ok := ctx.Value("user_id").(string)
	if !ok {
		return nil, status.Error(codes.Unauthenticated, "user not authenticated")
	}

	// Create view
	view := &models.SavedView{
		ID:          uuid.New(),
		Name:        req.Name,
		OwnerID:     uuid.MustParse(userID),
		IsTeamView:  req.IsTeamView,
		QueryString: req.QueryString,
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	// Add team ID if it's a team view
	if req.IsTeamView && req.TeamId != "" {
		teamID := uuid.MustParse(req.TeamId)
		view.TeamID = &teamID
	}

	// Save view to database
	if err := s.viewRepo.Create(ctx, view); err != nil {
		return nil, status.Errorf(codes.Internal, "failed to create saved view: %v", err)
	}

	// Convert to protobuf response
	return s.viewToProto(view), nil
}

// GetView gets a saved view
func (s *Service) GetView(ctx context.Context, req *pb.GetViewRequest) (*pb.SavedView, error) {
	if req.Id == "" {
		return nil, status.Error(codes.InvalidArgument, "view ID is required")
	}

	viewID, err := uuid.Parse(req.Id)
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid view ID format")
	}

	// Get view from database
	view, err := s.viewRepo.GetByID(ctx, viewID)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, status.Error(codes.NotFound, "view not found")
		}
		return nil, status.Errorf(codes.Internal, "failed to get view: %v", err)
	}

	// Verify permission to access the view
	userID, ok := ctx.Value("user_id").(string)
	if !ok {
		return nil, status.Error(codes.Unauthenticated, "user not authenticated")
	}

	// Check if the user is the owner or if it's a team view and the user is in the team
	if view.OwnerID.String() != userID {
		if !view.IsTeamView || view.TeamID == nil {
			return nil, status.Error(codes.PermissionDenied, "not authorized to access this view")
		}

		// Check if user is in the team (would be implemented in a real system)
		inTeam, err := s.userRepo.IsUserInTeam(ctx, uuid.MustParse(userID), *view.TeamID)
		if err != nil {
			return nil, status.Errorf(codes.Internal, "failed to check team membership: %v", err)
		}
		if !inTeam {
			return nil, status.Error(codes.PermissionDenied, "not authorized to access this view")
		}
	}

	// Convert to protobuf response
	return s.viewToProto(view), nil
}

// ListViews lists saved views for a user or team
func (s *Service) ListViews(ctx context.Context, req *pb.ListViewsRequest) (*pb.ListViewsResponse, error) {
	// Get user ID from context if not provided in request
	userID := req.UserId
	if userID == "" {
		var ok bool
		userID, ok = ctx.Value("user_id").(string)
		if !ok {
			return nil, status.Error(codes.Unauthenticated, "user not authenticated")
		}
	}

	// Query views for the user (both their personal views and their team views)
	views, err := s.viewRepo.ListUserViews(ctx, uuid.MustParse(userID), req.TeamId)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to list views: %v", err)
	}

	// Convert to protobuf response
	response := &pb.ListViewsResponse{
		Views: make([]*pb.SavedView, len(views)),
	}

	for i, view := range views {
		response.Views[i] = s.viewToProto(view)
	}

	return response, nil
}

// Helper functions

// modelToProto converts a model.Issue to a protobuf Issue
func (s *Service) modelToProto(issue *models.Issue) *pb.Issue {
	protoIssue := &pb.Issue{
		Id:             issue.ID.String(),
		Title:          issue.Title,
		Description:    issue.Description,
		ReproduceSteps: issue.ReproduceSteps,
		ComponentId:    issue.ComponentID.String(),
		ReporterId:     issue.ReporterID.String(),
		Status:         pb.Status(pb.Status_value[string(issue.Status)]),
		CreatedAt:      timestamppb.New(issue.CreatedAt),
		UpdatedAt:      timestamppb.New(issue.UpdatedAt),
		Labels:         issue.Labels,
	}

	// Handle optional fields
	if issue.AssigneeID != nil {
		protoIssue.AssigneeId = issue.AssigneeID.String()
	}
	if issue.DueDate != nil {
		protoIssue.DueDate = timestamppb.New(*issue.DueDate)
	}

	// Map priority and severity
	switch issue.Priority {
	case models.PriorityP0:
		protoIssue.Priority = pb.Priority_P0
	case models.PriorityP1:
		protoIssue.Priority = pb.Priority_P1
	case models.PriorityP2:
		protoIssue.Priority = pb.Priority_P2
	case models.PriorityP3:
		protoIssue.Priority = pb.Priority_P3
	case models.PriorityP4:
		protoIssue.Priority = pb.Priority_P4
	}

	switch issue.Severity {
	case models.SeverityS0:
		protoIssue.Severity = pb.Severity_S0
	case models.SeverityS1:
		protoIssue.Severity = pb.Severity_S1
	case models.SeverityS2:
		protoIssue.Severity = pb.Severity_S2
	case models.SeverityS3:
		protoIssue.Severity = pb.Severity_S3
	}

	return protoIssue
}

// viewToProto converts a model.SavedView to a protobuf SavedView
func (s *Service) viewToProto(view *models.SavedView) *pb.SavedView {
	protoView := &pb.SavedView{
		Id:          view.ID.String(),
		Name:        view.Name,
		OwnerId:     view.OwnerID.String(),
		IsTeamView:  view.IsTeamView,
		QueryString: view.QueryString,
		CreatedAt:   timestamppb.New(view.CreatedAt),
		UpdatedAt:   timestamppb.New(view.UpdatedAt),
	}

	// Handle optional fields
	if view.TeamID != nil {
		protoView.TeamId = view.TeamID.String()
	}

	return protoView
}
