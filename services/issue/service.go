// services/issue/service.go
package issue

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"github.com/google/uuid"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/types/known/timestamppb"

	"github.com/mmcgibbon1/buganizer/models"
	pb "github.com/mmcgibbon1/buganizer/proto"
	"github.com/mmcgibbon1/buganizer/repositories"
)

// Service implements the IssueService gRPC interface
type Service struct {
	pb.UnimplementedIssueServiceServer
	issueRepo      repositories.IssueRepository
	commentRepo    repositories.CommentRepository
	attachmentRepo repositories.AttachmentRepository
	slaService     pb.SLAServiceClient
	notifService   pb.NotificationServiceClient
}

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

// NewService creates a new issue service
func NewService(
	issueRepo repositories.IssueRepository,
	commentRepo repositories.CommentRepository,
	attachmentRepo repositories.AttachmentRepository,
	slaService pb.SLAServiceClient,
	notifService pb.NotificationServiceClient,
) *Service {
	return &Service{
		issueRepo:      issueRepo,
		commentRepo:    commentRepo,
		attachmentRepo: attachmentRepo,
		slaService:     slaService,
		notifService:   notifService,
	}
}

// CreateIssue creates a new issue
func (s *Service) CreateIssue(ctx context.Context, req *pb.CreateIssueRequest) (*pb.Issue, error) {
	// Validate request
	if req.Title == "" {
		return nil, status.Error(codes.InvalidArgument, "title is required")
	}
	if req.ComponentId == "" {
		return nil, status.Error(codes.InvalidArgument, "component_id is required")
	}

	// Get user ID from context
	userID, ok := ctx.Value("user_id").(string)
	if !ok {
		return nil, status.Error(codes.Unauthenticated, "user not authenticated")
	}

	// Create issue
	issue := &models.Issue{
		ID:             uuid.New(),
		Title:          req.Title,
		Description:    req.Description,
		ReproduceSteps: req.ReproduceSteps,
		ComponentID:    uuid.MustParse(req.ComponentId),
		ReporterID:     uuid.MustParse(userID),
		Priority:       models.Priority(req.Priority.String()),
		Severity:       models.Severity(req.Severity.String()),
		Status:         models.StatusNew,
		CreatedAt:      time.Now(),
		UpdatedAt:      time.Now(),
		Labels:         req.Labels,
	}

	// Calculate SLA based on priority and severity
	slaResp, err := s.slaService.CalculateSLATarget(ctx, &pb.CalculateSLARequest{
		Priority:    req.Priority,
		Severity:    req.Severity,
		ComponentId: req.ComponentId,
	})
	if err == nil && slaResp != nil && slaResp.TargetDate != nil {
		dueDate := slaResp.TargetDate.AsTime()
		issue.DueDate = &dueDate
	}

	// Save issue to database
	if err := s.issueRepo.Create(ctx, issue); err != nil {
		return nil, status.Errorf(codes.Internal, "failed to create issue: %v", err)
	}

	// Send notification
	_, _ = s.notifService.SendSlackNotification(ctx, &pb.NotificationRequest{
		IssueId: issue.ID.String(),
		Type:    pb.NotificationRequest_ISSUE_CREATED,
		Message: fmt.Sprintf("New issue created: %s", issue.Title),
	})

	// Convert to protobuf response
	return s.modelToProto(issue), nil
}

// GetIssue retrieves an issue by ID
func (s *Service) GetIssue(ctx context.Context, req *pb.GetIssueRequest) (*pb.Issue, error) {
	if req.Id == "" {
		return nil, status.Error(codes.InvalidArgument, "issue ID is required")
	}

	issueID, err := uuid.Parse(req.Id)
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid issue ID format")
	}

	issue, err := s.issueRepo.GetByID(ctx, issueID)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, status.Error(codes.NotFound, "issue not found")
		}
		return nil, status.Errorf(codes.Internal, "failed to get issue: %v", err)
	}

	return s.modelToProto(issue), nil
}

// UpdateIssue updates an existing issue
func (s *Service) UpdateIssue(ctx context.Context, req *pb.UpdateIssueRequest) (*pb.Issue, error) {
	if req.Id == "" {
		return nil, status.Error(codes.InvalidArgument, "issue ID is required")
	}

	issueID, err := uuid.Parse(req.Id)
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid issue ID format")
	}

	// Get existing issue
	issue, err := s.issueRepo.GetByID(ctx, issueID)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, status.Error(codes.NotFound, "issue not found")
		}
		return nil, status.Errorf(codes.Internal, "failed to get issue: %v", err)
	}

	// Check for status changes
	oldStatus := issue.Status
	statusChanged := false

	// Update fields
	if req.Title != "" {
		issue.Title = req.Title
	}
	if req.Description != "" {
		issue.Description = req.Description
	}
	if req.ReproduceSteps != "" {
		issue.ReproduceSteps = req.ReproduceSteps
	}
	if req.ComponentId != "" {
		issue.ComponentID = uuid.MustParse(req.ComponentId)
	}
	if req.AssigneeId != "" {
		assigneeID := uuid.MustParse(req.AssigneeId)
		issue.AssigneeID = &assigneeID
	}
	if req.Priority != pb.Priority_P0 {
		issue.Priority = models.Priority(req.Priority.String())
	}
	if req.Severity != pb.Severity_S0 {
		issue.Severity = models.Severity(req.Severity.String())
	}
	if req.Status != pb.Status_NEW {
		newStatus := models.Status(req.Status.String())
		if newStatus != issue.Status {
			statusChanged = true
			issue.Status = newStatus
		}
	}
	if len(req.Labels) > 0 {
		issue.Labels = req.Labels
	}

	issue.UpdatedAt = time.Now()

	// Save updated issue to database
	if err := s.issueRepo.Update(ctx, issue); err != nil {
		return nil, status.Errorf(codes.Internal, "failed to update issue: %v", err)
	}

	// Send notification if status changed
	if statusChanged {
		_, _ = s.notifService.SendSlackNotification(ctx, &pb.NotificationRequest{
			IssueId: issue.ID.String(),
			Type:    pb.NotificationRequest_ISSUE_UPDATED,
			Message: fmt.Sprintf("Issue status changed from %s to %s: %s", oldStatus, issue.Status, issue.Title),
		})
	}

	// If assignee changed, send notification
	if req.AssigneeId != "" {
		_, _ = s.notifService.SendSlackNotification(ctx, &pb.NotificationRequest{
			IssueId: issue.ID.String(),
			Type:    pb.NotificationRequest_ISSUE_ASSIGNED,
			Message: fmt.Sprintf("Issue assigned: %s", issue.Title),
		})
	}

	return s.modelToProto(issue), nil
}

// ListIssues lists issues with filtering
func (s *Service) ListIssues(ctx context.Context, req *pb.ListIssuesRequest) (*pb.ListIssuesResponse, error) {
	pageSize := 50
	if req.PageSize > 0 {
		pageSize = int(req.PageSize)
	}

	filter := req.Filter
	if filter == "" {
		filter = "is:open" // Default filter shows open issues
	}

	// Parse the page token (offset)
	offset := 0
	if req.PageToken != "" {
		// In a real implementation, you would decode the page token
		// to get the offset. Here we assume it's just the offset.
		fmt.Sscanf(req.PageToken, "%d", &offset)
	}

	// Query issues with filter
	issues, total, err := s.issueRepo.List(ctx, filter, pageSize, offset)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to list issues: %v", err)
	}

	// Convert to protobuf response
	response := &pb.ListIssuesResponse{
		Issues:    make([]*pb.Issue, len(issues)),
		TotalSize: int32(total),
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

// AddComment adds a comment to an issue
func (s *Service) AddComment(ctx context.Context, req *pb.AddCommentRequest) (*pb.Comment, error) {
	if req.IssueId == "" {
		return nil, status.Error(codes.InvalidArgument, "issue ID is required")
	}
	if req.Content == "" {
		return nil, status.Error(codes.InvalidArgument, "comment content is required")
	}

	// Get user ID from context
	userID, ok := ctx.Value("user_id").(string)
	if !ok {
		return nil, status.Error(codes.Unauthenticated, "user not authenticated")
	}

	issueID, err := uuid.Parse(req.IssueId)
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid issue ID format")
	}

	// Make sure the issue exists
	_, err = s.issueRepo.GetByID(ctx, issueID)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, status.Error(codes.NotFound, "issue not found")
		}
		return nil, status.Errorf(codes.Internal, "failed to get issue: %v", err)
	}

	// Create comment
	comment := &models.Comment{
		ID:        uuid.New(),
		IssueID:   issueID,
		AuthorID:  uuid.MustParse(userID),
		Content:   req.Content,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	// Save comment to database
	if err := s.commentRepo.Create(ctx, comment); err != nil {
		return nil, status.Errorf(codes.Internal, "failed to create comment: %v", err)
	}

	// Send notification
	_, _ = s.notifService.SendSlackNotification(ctx, &pb.NotificationRequest{
		IssueId: req.IssueId,
		Type:    pb.NotificationRequest_COMMENT_ADDED,
		Message: fmt.Sprintf("New comment added to issue"),
	})

	// Convert to protobuf response
	return &pb.Comment{
		Id:        comment.ID.String(),
		IssueId:   comment.IssueID.String(),
		AuthorId:  comment.AuthorID.String(),
		Content:   comment.Content,
		CreatedAt: timestamppb.New(comment.CreatedAt),
		UpdatedAt: timestamppb.New(comment.UpdatedAt),
	}, nil
}

// AddAttachment adds an attachment to an issue
func (s *Service) AddAttachment(ctx context.Context, req *pb.AddAttachmentRequest) (*pb.Attachment, error) {
	if req.IssueId == "" {
		return nil, status.Error(codes.InvalidArgument, "issue ID is required")
	}
	if req.Filename == "" {
		return nil, status.Error(codes.InvalidArgument, "filename is required")
	}
	if len(req.Content) == 0 {
		return nil, status.Error(codes.InvalidArgument, "attachment content is required")
	}

	// Get user ID from context
	userID, ok := ctx.Value("user_id").(string)
	if !ok {
		return nil, status.Error(codes.Unauthenticated, "user not authenticated")
	}

	issueID, err := uuid.Parse(req.IssueId)
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid issue ID format")
	}

	// Make sure the issue exists
	_, err = s.issueRepo.GetByID(ctx, issueID)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, status.Error(codes.NotFound, "issue not found")
		}
		return nil, status.Errorf(codes.Internal, "failed to get issue: %v", err)
	}

	// In a real implementation, we would store the file in a storage service
	// and get back a URL. For this example, we'll simulate that.
	fileID := uuid.New()
	fileURL := fmt.Sprintf("https://storage.example.com/files/%s", fileID)

	// Create attachment
	attachment := &models.Attachment{
		ID:         fileID,
		IssueID:    issueID,
		UploaderID: uuid.MustParse(userID),
		Filename:   req.Filename,
		FileURL:    fileURL,
		FileSize:   int64(len(req.Content)),
		CreatedAt:  time.Now(),
	}

	// Save attachment to database
	if err := s.attachmentRepo.Create(ctx, attachment); err != nil {
		return nil, status.Errorf(codes.Internal, "failed to create attachment: %v", err)
	}

	// Convert to protobuf response
	return &pb.Attachment{
		Id:         attachment.ID.String(),
		IssueId:    attachment.IssueID.String(),
		UploaderId: attachment.UploaderID.String(),
		Filename:   attachment.Filename,
		FileUrl:    attachment.FileURL,
		FileSize:   attachment.FileSize,
		CreatedAt:  timestamppb.New(attachment.CreatedAt),
	}, nil
}
