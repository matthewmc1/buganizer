// services/notification/service.go
package notification

import (
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/google/uuid"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/types/known/emptypb"

	"github.com/mmcgibbon1/buganizer/config"
	"github.com/mmcgibbon1/buganizer/models"
	pb "github.com/mmcgibbon1/buganizer/proto"
	"github.com/mmcgibbon1/buganizer/repositories"
)

// Service implements the NotificationService gRPC interface
type Service struct {
	pb.UnimplementedNotificationServiceServer
	webhookRepo    repositories.WebhookRepository
	userRepo       repositories.UserRepository
	issueRepo      repositories.IssueRepository
	preferenceRepo repositories.NotificationPreferenceRepository
	slackClient    *SlackClient
	config         *config.Config
}

// NewService creates a new notification service
func NewService(
	webhookRepo repositories.WebhookRepository,
	userRepo repositories.UserRepository,
	issueRepo repositories.IssueRepository,
	preferenceRepo repositories.NotificationPreferenceRepository,
	config *config.Config,
) *Service {
	return &Service{
		webhookRepo:    webhookRepo,
		userRepo:       userRepo,
		issueRepo:      issueRepo,
		preferenceRepo: preferenceRepo,
		slackClient:    NewSlackClient(config.Slack.APIToken),
		config:         config,
	}
}

// SendSlackNotification sends a notification to Slack
func (s *Service) SendSlackNotification(ctx context.Context, req *pb.NotificationRequest) (*pb.NotificationResponse, error) {
	if req.IssueId == "" {
		return nil, status.Error(codes.InvalidArgument, "issue ID is required")
	}

	// Get issue details
	issueID, err := uuid.Parse(req.IssueId)
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, "invalid issue ID format")
	}

	issue, err := s.issueRepo.GetByID(ctx, issueID)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to get issue: %v", err)
	}

	// Determine which channel to send to (use default if not specified)
	channel := req.Channel
	if channel == "" {
		channel = s.config.Slack.DefaultChannel
	}

	// Create Slack message
	message := req.Message
	if message == "" {
		// Create a default message based on notification type
		switch req.Type {
		case pb.NotificationRequest_ISSUE_CREATED:
			message = fmt.Sprintf("New issue created: %s", issue.Title)
		case pb.NotificationRequest_ISSUE_UPDATED:
			message = fmt.Sprintf("Issue updated: %s", issue.Title)
		case pb.NotificationRequest_ISSUE_ASSIGNED:
			message = fmt.Sprintf("Issue assigned: %s", issue.Title)
		case pb.NotificationRequest_COMMENT_ADDED:
			message = fmt.Sprintf("New comment on issue: %s", issue.Title)
		case pb.NotificationRequest_SLA_AT_RISK:
			message = fmt.Sprintf("⚠️ SLA at risk for issue: %s", issue.Title)
		case pb.NotificationRequest_SLA_BREACHED:
			message = fmt.Sprintf("🚨 SLA breached for issue: %s", issue.Title)
		default:
			message = fmt.Sprintf("Update on issue: %s", issue.Title)
		}
	}

	// Create structured Slack message with blocks
	issueURL := fmt.Sprintf("%s/issues/%s", s.config.BaseURL, issue.ID.String())

	// Create rich message with blocks
	blocks := []SlackBlock{
		{
			Type: "header",
			Text: &SlackText{
				Type: "plain_text",
				Text: getEmojiForNotificationType(req.Type) + " " + getActionText(req.Type),
			},
		},
		{
			Type: "section",
			Text: &SlackText{
				Type: "mrkdwn",
				Text: fmt.Sprintf("*<%s|%s>*\n%s", issueURL, issue.Title, truncateString(issue.Description, 100)),
			},
		},
		{
			Type: "section",
			Fields: []*SlackText{
				{
					Type: "mrkdwn",
					Text: fmt.Sprintf("*Priority:*\n%s", issue.Priority),
				},
				{
					Type: "mrkdwn",
					Text: fmt.Sprintf("*Severity:*\n%s", issue.Severity),
				},
				{
					Type: "mrkdwn",
					Text: fmt.Sprintf("*Status:*\n%s", issue.Status),
				},
			},
		},
		{
			Type: "actions",
			Elements: []SlackElement{
				{
					Type: "button",
					Text: &SlackText{
						Type: "plain_text",
						Text: "View Issue",
					},
					URL: issueURL,
				},
			},
		},
		{
			Type: "divider",
		},
	}

	// Send notification to Slack
	err = s.slackClient.SendMessage(channel, message, blocks)
	if err != nil {
		return &pb.NotificationResponse{
			Success: false,
			Message: fmt.Sprintf("Failed to send Slack notification: %v", err),
		}, nil
	}

	// Also send notification to registered webhooks for this event type
	go s.sendToWebhooks(ctx, req)

	return &pb.NotificationResponse{
		Success: true,
		Message: "Notification sent successfully",
	}, nil
}

// RegisterWebhook registers a webhook URL for notifications
func (s *Service) RegisterWebhook(ctx context.Context, req *pb.RegisterWebhookRequest) (*pb.RegisterWebhookResponse, error) {
	if req.Url == "" {
		return nil, status.Error(codes.InvalidArgument, "webhook URL is required")
	}

	// Get user ID from context
	userID, ok := ctx.Value("user_id").(string)
	if !ok {
		return nil, status.Error(codes.Unauthenticated, "user not authenticated")
	}

	// Create webhook
	webhook := &models.Webhook{
		ID:           uuid.New(),
		URL:          req.Url,
		Description:  req.Description,
		Secret:       req.Secret,
		CreatorID:    uuid.MustParse(userID),
		EventTypes:   req.EventTypes,
		CreatedAt:    time.Now(),
		LastCalledAt: nil,
	}

	// Save webhook to database
	if err := s.webhookRepo.Create(ctx, webhook); err != nil {
		return nil, status.Errorf(codes.Internal, "failed to register webhook: %v", err)
	}

	return &pb.RegisterWebhookResponse{
		Id:      webhook.ID.String(),
		Success: true,
	}, nil
}

// UpdateNotificationPreferences updates a user's notification preferences
func (s *Service) UpdateNotificationPreferences(ctx context.Context, req *pb.UpdateNotificationPreferencesRequest) (*emptypb.Empty, error) {
	// Get user ID from context or request
	userID := req.UserId
	if userID == "" {
		var ok bool
		userID, ok = ctx.Value("user_id").(string)
		if !ok {
			return nil, status.Error(codes.Unauthenticated, "user not authenticated")
		}
	}

	// Check if user exists
	_, err := s.userRepo.GetByID(ctx, uuid.MustParse(userID))
	if err != nil {
		return nil, status.Errorf(codes.NotFound, "user not found: %v", err)
	}

	// Create or update preferences
	pref := &models.NotificationPreference{
		UserID:             uuid.MustParse(userID),
		EmailNotifications: req.EmailNotifications,
		SlackNotifications: req.SlackNotifications,
		SubscribedEvents:   req.SubscribedEvents,
		UpdatedAt:          time.Now(),
	}

	if err := s.preferenceRepo.Upsert(ctx, pref); err != nil {
		return nil, status.Errorf(codes.Internal, "failed to update notification preferences: %v", err)
	}

	return &emptypb.Empty{}, nil
}

// Helper methods

// sendToWebhooks sends a notification to all registered webhooks for the given event type
func (s *Service) sendToWebhooks(ctx context.Context, req *pb.NotificationRequest) {
	// Get all webhooks that are subscribed to this event type
	eventType := req.Type.String()
	webhooks, err := s.webhookRepo.ListByEventType(ctx, eventType)
	if err != nil {
		// Log error but don't fail the request
		fmt.Printf("Error getting webhooks: %v\n", err)
		return
	}

	// Get issue details for the payload
	issueID, _ := uuid.Parse(req.IssueId)
	issue, err := s.issueRepo.GetByID(ctx, issueID)
	if err != nil {
		fmt.Printf("Error getting issue: %v\n", err)
		return
	}

	// Create webhook payload
	payload := WebhookPayload{
		EventType: eventType,
		Timestamp: time.Now().Unix(),
		IssueID:   issue.ID.String(),
		Title:     issue.Title,
		Status:    string(issue.Status),
		Priority:  string(issue.Priority),
		Severity:  string(issue.Severity),
		URL:       fmt.Sprintf("%s/issues/%s", s.config.BaseURL, issue.ID.String()),
	}

	// Send to each webhook
	for _, webhook := range webhooks {
		go func(wh models.Webhook) {
			payloadBytes, _ := json.Marshal(payload)

			// Create signature if secret is provided
			var signature string
			if wh.Secret != "" {
				h := hmac.New(sha256.New, []byte(wh.Secret))
				h.Write(payloadBytes)
				signature = hex.EncodeToString(h.Sum(nil))
			}

			// Create HTTP request
			req, _ := http.NewRequest("POST", wh.URL, strings.NewReader(string(payloadBytes)))
			req.Header.Set("Content-Type", "application/json")
			req.Header.Set("User-Agent", "Buganizer-Webhook")
			if signature != "" {
				req.Header.Set("X-Buganizer-Signature", signature)
			}

			// Send request
			client := &http.Client{Timeout: 10 * time.Second}
			resp, err := client.Do(req)

			// Update last called time and status
			now := time.Now()
			success := err == nil && resp != nil && resp.StatusCode >= 200 && resp.StatusCode < 300
			s.webhookRepo.UpdateStatus(context.Background(), wh.ID, &now, success)

			if resp != nil {
				defer resp.Body.Close()
			}
		}(webhook)
	}
}

// SlackClient is a simple client for sending messages to Slack
type SlackClient struct {
	APIToken string
}

// NewSlackClient creates a new Slack client
func NewSlackClient(apiToken string) *SlackClient {
	return &SlackClient{
		APIToken: apiToken,
	}
}

// SlackText represents text in a Slack message
type SlackText struct {
	Type  string `json:"type"`
	Text  string `json:"text"`
	Emoji bool   `json:"emoji,omitempty"`
}

// SlackElement represents an element in a Slack block
type SlackElement struct {
	Type     string     `json:"type"`
	Text     *SlackText `json:"text,omitempty"`
	URL      string     `json:"url,omitempty"`
	ActionID string     `json:"action_id,omitempty"`
}

// SlackBlock represents a block in a Slack message
type SlackBlock struct {
	Type     string         `json:"type"`
	Text     *SlackText     `json:"text,omitempty"`
	Fields   []*SlackText   `json:"fields,omitempty"`
	Elements []SlackElement `json:"elements,omitempty"`
}

// SlackMessage represents a Slack message
type SlackMessage struct {
	Channel string       `json:"channel"`
	Text    string       `json:"text"`
	Blocks  []SlackBlock `json:"blocks,omitempty"`
}

// WebhookPayload represents the payload sent to webhooks
type WebhookPayload struct {
	EventType string `json:"event_type"`
	Timestamp int64  `json:"timestamp"`
	IssueID   string `json:"issue_id"`
	Title     string `json:"title"`
	Status    string `json:"status"`
	Priority  string `json:"priority"`
	Severity  string `json:"severity"`
	URL       string `json:"url"`
}

// SendMessage sends a message to a Slack channel
func (c *SlackClient) SendMessage(channel, text string, blocks []SlackBlock) error {
	message := SlackMessage{
		Channel: channel,
		Text:    text, // Fallback text
		Blocks:  blocks,
	}

	payload, err := json.Marshal(message)
	if err != nil {
		return fmt.Errorf("failed to marshal Slack message: %v", err)
	}

	req, err := http.NewRequest("POST", "https://slack.com/api/chat.postMessage", strings.NewReader(string(payload)))
	if err != nil {
		return fmt.Errorf("failed to create request: %v", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+c.APIToken)

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("failed to send request: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("slack API returned non-OK status: %d", resp.StatusCode)
	}

	var slackResponse struct {
		OK    bool   `json:"ok"`
		Error string `json:"error,omitempty"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&slackResponse); err != nil {
		return fmt.Errorf("failed to decode response: %v", err)
	}

	if !slackResponse.OK {
		return fmt.Errorf("slack API error: %s", slackResponse.Error)
	}

	return nil
}

// getEmojiForNotificationType returns an emoji for a notification type
func getEmojiForNotificationType(notificationType pb.NotificationRequest_NotificationType) string {
	switch notificationType {
	case pb.NotificationRequest_ISSUE_CREATED:
		return "🆕"
	case pb.NotificationRequest_ISSUE_UPDATED:
		return "📝"
	case pb.NotificationRequest_ISSUE_ASSIGNED:
		return "👤"
	case pb.NotificationRequest_COMMENT_ADDED:
		return "💬"
	case pb.NotificationRequest_SLA_AT_RISK:
		return "⚠️"
	case pb.NotificationRequest_SLA_BREACHED:
		return "🚨"
	default:
		return "📣"
	}
}

// getActionText returns a text description for a notification type
func getActionText(notificationType pb.NotificationRequest_NotificationType) string {
	switch notificationType {
	case pb.NotificationRequest_ISSUE_CREATED:
		return "New Issue Created"
	case pb.NotificationRequest_ISSUE_UPDATED:
		return "Issue Updated"
	case pb.NotificationRequest_ISSUE_ASSIGNED:
		return "Issue Assigned"
	case pb.NotificationRequest_COMMENT_ADDED:
		return "New Comment Added"
	case pb.NotificationRequest_SLA_AT_RISK:
		return "SLA At Risk"
	case pb.NotificationRequest_SLA_BREACHED:
		return "SLA Breached"
	default:
		return "Issue Update"
	}
}

// truncateString truncates a string to a given length
func truncateString(s string, maxLen int) string {
	if len(s) <= maxLen {
		return s
	}
	return s[:maxLen-3] + "..."
}
