// middleware/auth.go
package middleware

import (
	"context"
	"strings"

	"github.com/golang-jwt/jwt/v4"
	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/metadata"
	"google.golang.org/grpc/status"

	"github.com/matthewmc1/buganizer/config"
	"github.com/matthewmc1/buganizer/services/auth"
)

// AuthInterceptor is a server interceptor for authentication and authorization
type AuthInterceptor struct {
	jwtSecret   string
	publicPaths map[string]bool
}

// NewAuthInterceptor creates a new auth interceptor
func NewAuthInterceptor(config *config.Config) *AuthInterceptor {
	// Define paths that don't require authentication
	publicPaths := map[string]bool{
		"/buganizer.AuthService/AuthenticateWithGoogle": true,
		"/buganizer.AuthService/ValidateToken":          true,
		"/health.HealthService/Check":                   true,
	}

	return &AuthInterceptor{
		jwtSecret:   config.Auth.JWTSecret,
		publicPaths: publicPaths,
	}
}

// Unary returns a server interceptor function to authenticate and authorize unary RPC
func (interceptor *AuthInterceptor) Unary() grpc.UnaryServerInterceptor {
	return func(
		ctx context.Context,
		req interface{},
		info *grpc.UnaryServerInfo,
		handler grpc.UnaryHandler,
	) (interface{}, error) {
		// Skip authentication for public paths
		if interceptor.publicPaths[info.FullMethod] {
			return handler(ctx, req)
		}

		// Extract token from metadata
		userID, err := interceptor.authenticate(ctx)
		if err != nil {
			return nil, err
		}

		// Add user ID to the context
		newCtx := context.WithValue(ctx, "user_id", userID)

		// Continue with the handler
		return handler(newCtx, req)
	}
}

// Stream returns a server interceptor function to authenticate and authorize stream RPC
func (interceptor *AuthInterceptor) Stream() grpc.StreamServerInterceptor {
	return func(
		srv interface{},
		stream grpc.ServerStream,
		info *grpc.StreamServerInfo,
		handler grpc.StreamHandler,
	) error {
		// Skip authentication for public paths
		if interceptor.publicPaths[info.FullMethod] {
			return handler(srv, stream)
		}

		// Extract token from metadata
		userID, err := interceptor.authenticate(stream.Context())
		if err != nil {
			return err
		}

		// Create a new context with the user ID
		newCtx := context.WithValue(stream.Context(), "user_id", userID)

		// Wrap the stream to use the new context
		wrappedStream := &wrappedServerStream{
			ServerStream: stream,
			ctx:          newCtx,
		}

		// Continue with the handler
		return handler(srv, wrappedStream)
	}
}

// authenticate extracts and verifies the JWT token from the context
func (interceptor *AuthInterceptor) authenticate(ctx context.Context) (string, error) {
	md, ok := metadata.FromIncomingContext(ctx)
	if !ok {
		return "", status.Errorf(codes.Unauthenticated, "metadata is not provided")
	}

	values := md["authorization"]
	if len(values) == 0 {
		return "", status.Errorf(codes.Unauthenticated, "authorization token is not provided")
	}

	accessToken := values[0]
	if !strings.HasPrefix(accessToken, "Bearer ") {
		return "", status.Errorf(codes.Unauthenticated, "invalid authorization format")
	}

	tokenString := strings.TrimPrefix(accessToken, "Bearer ")
	claims, err := interceptor.verifyToken(tokenString)
	if err != nil {
		return "", status.Errorf(codes.Unauthenticated, "invalid token: %v", err)
	}

	return claims.UserID, nil
}

// verifyToken verifies the JWT token
func (interceptor *AuthInterceptor) verifyToken(tokenString string) (*auth.JWTClaims, error) {
	token, err := jwt.ParseWithClaims(
		tokenString,
		&auth.JWTClaims{},
		func(token *jwt.Token) (interface{}, error) {
			_, ok := token.Method.(*jwt.SigningMethodHMAC)
			if !ok {
				return nil, status.Errorf(codes.Unauthenticated, "unexpected token signing method")
			}

			return []byte(interceptor.jwtSecret), nil
		},
	)

	if err != nil {
		return nil, err
	}

	claims, ok := token.Claims.(*auth.JWTClaims)
	if !ok || !token.Valid {
		return nil, status.Errorf(codes.Unauthenticated, "invalid token claims")
	}

	return claims, nil
}

// wrappedServerStream wraps grpc.ServerStream to modify the context
type wrappedServerStream struct {
	grpc.ServerStream
	ctx context.Context
}

// Context returns the wrapped context
func (w *wrappedServerStream) Context() context.Context {
	return w.ctx
}
