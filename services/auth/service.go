// services/auth/service.go
package auth

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"github.com/golang-jwt/jwt/v4"
	"github.com/google/uuid"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/types/known/timestamppb"

	"github.com/mmcgibbon1/buganizer/config"
	"github.com/mmcgibbon1/buganizer/models"
	pb "github.com/mmcgibbon1/buganizer/proto"
	"github.com/mmcgibbon1/mmcgibbon1/repositories"
)

// Service implements the AuthService gRPC interface
type Service struct {
	pb.UnimplementedAuthServiceServer
	userRepo repositories.UserRepository
	config   *config.Config
}

// NewService creates a new auth service
func NewService(
	userRepo repositories.UserRepository,
	config *config.Config,
) *Service {
	return &Service{
		userRepo: userRepo,
		config:   config,
	}
}

// GoogleUserInfo represents the user info returned by Google's userinfo endpoint
type GoogleUserInfo struct {
	ID            string `json:"id"`
	Email         string `json:"email"`
	VerifiedEmail bool   `json:"verified_email"`
	Name          string `json:"name"`
	GivenName     string `json:"given_name"`
	FamilyName    string `json:"family_name"`
	Picture       string `json:"picture"`
	Locale        string `json:"locale"`
	HD            string `json:"hd"` // Hosted domain (for Google Workspace accounts)
}

// JWTClaims represents the claims in a JWT token
type JWTClaims struct {
	UserID    string `json:"user_id"`
	Email     string `json:"email"`
	Name      string `json:"name"`
	GoogleID  string `json:"google_id"`
	AvatarURL string `json:"avatar_url"`
	jwt.RegisteredClaims
}

// AuthenticateWithGoogle authenticates a user using a Google auth token
func (s *Service) AuthenticateWithGoogle(ctx context.Context, req *pb.AuthenticateWithGoogleRequest) (*pb.AuthenticateResponse, error) {
	if req.GoogleToken == "" {
		return nil, status.Error(codes.InvalidArgument, "Google token is required")
	}

	// Verify the Google token and get user info
	userInfo, err := s.verifyGoogleToken(req.GoogleToken)
	if err != nil {
		return nil, status.Errorf(codes.Unauthenticated, "failed to verify Google token: %v", err)
	}

	// Check if the user's domain is allowed
	if s.config.Auth.RestrictDomain && userInfo.HD != s.config.Auth.AllowedDomain {
		return nil, status.Errorf(codes.PermissionDenied, "domain %s is not allowed", userInfo.HD)
	}

	// Look up if user already exists
	existingUser, err := s.userRepo.GetByGoogleID(ctx, userInfo.ID)
	if err != nil {
		// User doesn't exist, create a new one
		newUser := &models.User{
			ID:        uuid.New(),
			Email:     userInfo.Email,
			Name:      userInfo.Name,
			GoogleID:  userInfo.ID,
			AvatarURL: userInfo.Picture,
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		}

		// Save to database
		if err := s.userRepo.Create(ctx, newUser); err != nil {
			return nil, status.Errorf(codes.Internal, "failed to create user: %v", err)
		}

		existingUser = newUser
	}

	// Update user info if it has changed
	needsUpdate := false
	if existingUser.Email != userInfo.Email {
		existingUser.Email = userInfo.Email
		needsUpdate = true
	}
	if existingUser.Name != userInfo.Name {
		existingUser.Name = userInfo.Name
		needsUpdate = true
	}
	if existingUser.AvatarURL != userInfo.Picture {
		existingUser.AvatarURL = userInfo.Picture
		needsUpdate = true
	}

	if needsUpdate {
		existingUser.UpdatedAt = time.Now()
		if err := s.userRepo.Update(ctx, existingUser); err != nil {
			return nil, status.Errorf(codes.Internal, "failed to update user: %v", err)
		}
	}

	// Generate JWT token
	token, expiresAt, err := s.generateToken(existingUser)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to generate token: %v", err)
	}

	// Return the authentication response
	return &pb.AuthenticateResponse{
		Token:     token,
		ExpiresAt: expiresAt,
		User: &pb.User{
			Id:        existingUser.ID.String(),
			Email:     existingUser.Email,
			Name:      existingUser.Name,
			GoogleId:  existingUser.GoogleID,
			AvatarUrl: existingUser.AvatarURL,
			CreatedAt: timestamppb.New(existingUser.CreatedAt),
			UpdatedAt: timestamppb.New(existingUser.UpdatedAt),
		},
	}, nil
}

// ValidateToken validates a JWT token
func (s *Service) ValidateToken(ctx context.Context, req *pb.ValidateTokenRequest) (*pb.ValidateTokenResponse, error) {
	if req.Token == "" {
		return nil, status.Error(codes.InvalidArgument, "token is required")
	}

	// Parse the JWT token
	token, err := jwt.ParseWithClaims(req.Token, &JWTClaims{}, func(token *jwt.Token) (interface{}, error) {
		// Validate signing method
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(s.config.Auth.JWTSecret), nil
	})

	// Handle parsing errors
	if err != nil {
		return &pb.ValidateTokenResponse{
			Valid:  false,
			UserId: "",
		}, nil
	}

	// Check if token is valid
	if claims, ok := token.Claims.(*JWTClaims); ok && token.Valid {
		return &pb.ValidateTokenResponse{
			Valid:  true,
			UserId: claims.UserID,
		}, nil
	}

	return &pb.ValidateTokenResponse{
		Valid:  false,
		UserId: "",
	}, nil
}

// GetCurrentUser gets the current user based on the JWT token
func (s *Service) GetCurrentUser(ctx context.Context, req *pb.GetCurrentUserRequest) (*pb.User, error) {
	if req.Token == "" {
		return nil, status.Error(codes.InvalidArgument, "token is required")
	}

	// Parse the JWT token
	token, err := jwt.ParseWithClaims(req.Token, &JWTClaims{}, func(token *jwt.Token) (interface{}, error) {
		return []byte(s.config.Auth.JWTSecret), nil
	})

	if err != nil {
		return nil, status.Errorf(codes.Unauthenticated, "invalid token: %v", err)
	}

	// Check if token is valid
	if claims, ok := token.Claims.(*JWTClaims); ok && token.Valid {
		// Get user from database to ensure latest data
		userID, err := uuid.Parse(claims.UserID)
		if err != nil {
			return nil, status.Error(codes.InvalidArgument, "invalid user ID in token")
		}

		user, err := s.userRepo.GetByID(ctx, userID)
		if err != nil {
			return nil, status.Errorf(codes.NotFound, "user not found: %v", err)
		}

		// Convert to protobuf response
		return &pb.User{
			Id:        user.ID.String(),
			Email:     user.Email,
			Name:      user.Name,
			GoogleId:  user.GoogleID,
			AvatarUrl: user.AvatarURL,
			CreatedAt: timestamppb.New(user.CreatedAt),
			UpdatedAt: timestamppb.New(user.UpdatedAt),
		}, nil
	}

	return nil, status.Error(codes.Unauthenticated, "invalid token")
}

// Helper methods

// verifyGoogleToken verifies a Google ID token and returns the user info
func (s *Service) verifyGoogleToken(idToken string) (*GoogleUserInfo, error) {
	// In a production environment, you would use the Google API client library
	// to verify the token. For simplicity, we'll just call Google's userinfo endpoint.
	client := &http.Client{Timeout: 10 * time.Second}
	req, err := http.NewRequest("GET", "https://www.googleapis.com/oauth2/v3/userinfo", nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %v", err)
	}

	req.Header.Add("Authorization", fmt.Sprintf("Bearer %s", idToken))

	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to send request: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("Google API returned non-OK status: %d", resp.StatusCode)
	}

	var userInfo GoogleUserInfo
	if err := json.NewDecoder(resp.Body).Decode(&userInfo); err != nil {
		return nil, fmt.Errorf("failed to decode response: %v", err)
	}

	return &userInfo, nil
}

// generateToken generates a JWT token for a user
func (s *Service) generateToken(user *models.User) (string, int64, error) {
	// Token expiration time (e.g., 24 hours)
	expirationTime := time.Now().Add(time.Duration(s.config.Auth.TokenExpiryHours) * time.Hour)
	expiresAt := expirationTime.Unix()

	// Create the JWT claims
	claims := &JWTClaims{
		UserID:    user.ID.String(),
		Email:     user.Email,
		Name:      user.Name,
		GoogleID:  user.GoogleID,
		AvatarURL: user.AvatarURL,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expirationTime),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			NotBefore: jwt.NewNumericDate(time.Now()),
			Issuer:    "buganizer",
			Subject:   user.ID.String(),
			ID:        generateJTI(),
		},
	}

	// Create token with claims
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	// Sign the token with the secret key
	tokenString, err := token.SignedString([]byte(s.config.Auth.JWTSecret))
	if err != nil {
		return "", 0, fmt.Errorf("failed to sign token: %v", err)
	}

	return tokenString, expiresAt, nil
}

// generateJTI generates a random JWT ID
func generateJTI() string {
	bytes := make([]byte, 16)
	_, err := rand.Read(bytes)
	if err != nil {
		return time.Now().String()
	}
	return base64.URLEncoding.EncodeToString(bytes)
}
