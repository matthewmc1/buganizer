// services/sla/service.go
package sla

import (
	"context"
	"fmt"
	"time"

	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/types/known/timestamppb"

	"github.com/matthewmc1/buganizer/models"
	pb "github.com/matthewmc1/buganizer/proto"
	"github.com/matthewmc1/buganizer/repositories"
)

// Service implements the SLAService gRPC interface
type Service struct {
	pb.UnimplementedSLAServiceServer
	issueRepo     repositories.IssueRepository
	componentRepo repositories.ComponentRepository
	notifService  pb.NotificationServiceClient
}

// NewService creates a new SLA service
func NewService(
	issueRepo repositories.IssueRepository,
	componentRepo repositories.ComponentRepository,
	notifService pb.NotificationServiceClient,
) *Service {
	return &Service{
		issueRepo:     issueRepo,
		componentRepo: componentRepo,
		notifService:  notifService,
	}
}

// CalculateSLATarget calculates the SLA target date based on priority and severity
func (s *Service) CalculateSLATarget(ctx context.Context, req *pb.CalculateSLARequest) (*pb.SLATarget, error) {
	if req.Priority == pb.Priority(0) {
		return nil, status.Error(codes.InvalidArgument, "priority is required")
	}
	if req.Severity == pb.Severity(0) {
		return nil, status.Error(codes.InvalidArgument, "severity is required")
	}

	// Calculate SLA target based on priority and severity
	// These values would typically come from a configuration system
	// For this example, we'll use hardcoded values
	var targetHours int

	// Calculate base SLA hours based on priority
	switch req.Priority {
	case pb.Priority_P0:
		targetHours = 4 // Critical - 4 hours
	case pb.Priority_P1:
		targetHours = 24 // High - 24 hours (1 day)
	case pb.Priority_P2:
		targetHours = 72 // Medium - 72 hours (3 days)
	case pb.Priority_P3:
		targetHours = 168 // Low - 168 hours (1 week)
	case pb.Priority_P4:
		targetHours = 336 // Trivial - 336 hours (2 weeks)
	default:
		targetHours = 72 // Default to medium
	}

	// Adjust based on severity
	switch req.Severity {
	case pb.Severity_S0:
		targetHours = targetHours / 2 // Cut time in half for critical severity
	case pb.Severity_S1:
		targetHours = int(float64(targetHours) * 0.75) // 25% reduction for major severity
	case pb.Severity_S2:
		// No change for moderate severity
	case pb.Severity_S3:
		targetHours = int(float64(targetHours) * 1.5) // 50% increase for minor severity
	default:
		// No adjustment for default
	}

	// Adjust for business hours (simplified)
	// In a real implementation, you would account for weekends and holidays
	targetDate := time.Now().Add(time.Duration(targetHours) * time.Hour)

	// Create human-readable description
	description := fmt.Sprintf("Target resolution time: %d hours (%s)",
		targetHours,
		targetDate.Format("2006-01-02 15:04:05"))

	response := &pb.SLATarget{
		Priority:    req.Priority,
		Severity:    req.Severity,
		TargetDate:  timestamppb.New(targetDate),
		Description: description,
	}

	return response, nil
}

// CheckSLARisk checks if issues are at risk of SLA breach
func (s *Service) CheckSLARisk(ctx context.Context, req *pb.CheckSLARiskRequest) (*pb.CheckSLARiskResponse, error) {
	// Default to not including closed issues
	includeClosed := req.IncludeClosed

	// Define what "at risk" means (e.g., less than 4 hours remaining)
	atRiskThresholdHours := 4
	atRiskThreshold := time.Now().Add(time.Duration(atRiskThresholdHours) * time.Hour)

	// Get all issues with due dates before the at-risk threshold
	filter := fmt.Sprintf("due_date:<=%s", atRiskThreshold.Format(time.RFC3339))

	// Add team filter if provided
	if req.TeamId != "" {
		filter += fmt.Sprintf(" team:%s", req.TeamId)
	}

	// Add status filter if not including closed issues
	if !includeClosed {
		filter += " is:open"
	}

	// Query issues with filter
	issues, _, err := s.issueRepo.List(ctx, filter, 100, 0)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to list issues: %v", err)
	}

	// Convert to response format
	response := &pb.CheckSLARiskResponse{
		AtRiskIssues: make([]*pb.SLARiskIssue, 0, len(issues)),
		TotalAtRisk:  int32(len(issues)),
	}

	for _, issue := range issues {
		if issue.DueDate == nil {
			continue // Skip issues without due dates
		}

		hoursRemaining := int32(issue.DueDate.Sub(time.Now()).Hours())

		riskIssue := &pb.SLARiskIssue{
			IssueId:        issue.ID.String(),
			Title:          issue.Title,
			DueDate:        timestamppb.New(*issue.DueDate),
			HoursRemaining: hoursRemaining,
		}

		// Map priority and severity
		switch issue.Priority {
		case models.PriorityP0:
			riskIssue.Priority = pb.Priority_P0
		case models.PriorityP1:
			riskIssue.Priority = pb.Priority_P1
		case models.PriorityP2:
			riskIssue.Priority = pb.Priority_P2
		case models.PriorityP3:
			riskIssue.Priority = pb.Priority_P3
		case models.PriorityP4:
			riskIssue.Priority = pb.Priority_P4
		}

		switch issue.Severity {
		case models.SeverityS0:
			riskIssue.Severity = pb.Severity_S0
		case models.SeverityS1:
			riskIssue.Severity = pb.Severity_S1
		case models.SeverityS2:
			riskIssue.Severity = pb.Severity_S2
		case models.SeverityS3:
			riskIssue.Severity = pb.Severity_S3
		}

		response.AtRiskIssues = append(response.AtRiskIssues, riskIssue)
	}

	return response, nil
}

// GetSLAStats gets SLA statistics for a component or team
func (s *Service) GetSLAStats(ctx context.Context, req *pb.GetSLAStatsRequest) (*pb.SLAStats, error) {
	// Validate request - need at least one of component_id or team_id
	if req.ComponentId == "" && req.TeamId == "" {
		return nil, status.Error(codes.InvalidArgument, "either component_id or team_id is required")
	}

	// Set default date range if not provided
	startDate := time.Now().AddDate(0, -1, 0) // Default to last month
	if req.StartDate != nil {
		startDate = req.StartDate.AsTime()
	}

	endDate := time.Now()
	if req.EndDate != nil {
		endDate = req.EndDate.AsTime()
	}

	// Build filter query
	filter := fmt.Sprintf("created_at:>=%s created_at:<=%s",
		startDate.Format(time.RFC3339),
		endDate.Format(time.RFC3339))

	if req.ComponentId != "" {
		filter += fmt.Sprintf(" component:%s", req.ComponentId)
	}

	if req.TeamId != "" {
		filter += fmt.Sprintf(" team:%s", req.TeamId)
	}

	// Query issues with filter
	issues, totalCount, err := s.issueRepo.List(ctx, filter, 1000, 0)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to list issues: %v", err)
	}

	// Calculate statistics
	stats := &pb.SLAStats{
		TotalIssues:             int32(totalCount),
		MetSla:                  0,
		MissedSla:               0,
		SlaCompliancePercentage: 0,
		IssuesByPriority:        make(map[string]int32),
		IssuesBySeverity:        make(map[string]int32),
		ComplianceByPriority:    make(map[string]float32),
		ComplianceBySeverity:    make(map[string]float32),
	}

	// Initialize counters for each priority and severity
	priorityMetCounts := make(map[string]int32)
	priorityTotalCounts := make(map[string]int32)
	severityMetCounts := make(map[string]int32)
	severityTotalCounts := make(map[string]int32)

	for _, issue := range issues {
		// Skip issues without due dates or not yet closed
		if issue.DueDate == nil ||
			(issue.Status != models.StatusClosed &&
				issue.Status != models.StatusVerified) {
			continue
		}

		priority := string(issue.Priority)
		severity := string(issue.Severity)

		// Count by priority
		priorityTotalCounts[priority]++
		stats.IssuesByPriority[priority]++

		// Count by severity
		severityTotalCounts[severity]++
		stats.IssuesBySeverity[severity]++

		// Check if SLA was met (closed before due date)
		metSLA := issue.UpdatedAt.Before(*issue.DueDate)
		if metSLA {
			stats.MetSla++
			priorityMetCounts[priority]++
			severityMetCounts[severity]++
		} else {
			stats.MissedSla++
		}
	}

	// Calculate overall compliance percentage
	if stats.TotalIssues > 0 {
		stats.SlaCompliancePercentage = float32(stats.MetSla) / float32(stats.TotalIssues) * 100
	}

	// Calculate compliance by priority
	for priority, total := range priorityTotalCounts {
		if total > 0 {
			stats.ComplianceByPriority[priority] = float32(priorityMetCounts[priority]) / float32(total) * 100
		}
	}

	// Calculate compliance by severity
	for severity, total := range severityTotalCounts {
		if total > 0 {
			stats.ComplianceBySeverity[severity] = float32(severityMetCounts[severity]) / float32(total) * 100
		}
	}

	return stats, nil
}
