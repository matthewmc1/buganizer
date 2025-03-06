// config/config.go
package config

import (
	"fmt"
	"os"
	"strconv"

	"github.com/joho/godotenv"
)

// Config holds all configuration for the application
type Config struct {
	Server   ServerConfig
	Database DatabaseConfig
	Auth     AuthConfig
	Slack    SlackConfig
	Storage  StorageConfig
	BaseURL  string
}

// ServerConfig holds configuration for the server
type ServerConfig struct {
	GRPCPort int
	HTTPPort int
}

// DatabaseConfig holds database configuration
type DatabaseConfig struct {
	Host                   string
	Port                   int
	User                   string
	Password               string
	DBName                 string
	MaxOpenConns           int
	MaxIdleConns           int
	ConnMaxLifetimeMinutes int
}

// AuthConfig holds authentication configuration
type AuthConfig struct {
	JWTSecret          string
	TokenExpiryHours   int
	GoogleClientID     string
	GoogleClientSecret string
	RestrictDomain     bool
	AllowedDomain      string
}

// SlackConfig holds configuration for Slack integration
type SlackConfig struct {
	APIToken       string
	DefaultChannel string
}

// StorageConfig holds configuration for file storage
type StorageConfig struct {
	Provider string // "local" or "gcs" or "s3"
	BasePath string // used for local storage
	Bucket   string // used for cloud storage
}

// Load loads configuration from environment variables or .env file
func Load() (*Config, error) {
	// Load .env file if it exists
	_ = godotenv.Load()

	// Server config
	grpcPort, err := strconv.Atoi(getEnv("GRPC_PORT", "50051"))
	if err != nil {
		return nil, fmt.Errorf("invalid GRPC_PORT: %v", err)
	}

	httpPort, err := strconv.Atoi(getEnv("HTTP_PORT", "8080"))
	if err != nil {
		return nil, fmt.Errorf("invalid HTTP_PORT: %v", err)
	}

	// Database config
	dbPort, err := strconv.Atoi(getEnv("DB_PORT", "5432"))
	if err != nil {
		return nil, fmt.Errorf("invalid DB_PORT: %v", err)
	}

	maxOpenConns, err := strconv.Atoi(getEnv("DB_MAX_OPEN_CONNS", "25"))
	if err != nil {
		return nil, fmt.Errorf("invalid DB_MAX_OPEN_CONNS: %v", err)
	}

	maxIdleConns, err := strconv.Atoi(getEnv("DB_MAX_IDLE_CONNS", "25"))
	if err != nil {
		return nil, fmt.Errorf("invalid DB_MAX_IDLE_CONNS: %v", err)
	}

	connMaxLifetime, err := strconv.Atoi(getEnv("DB_CONN_MAX_LIFETIME_MINUTES", "5"))
	if err != nil {
		return nil, fmt.Errorf("invalid DB_CONN_MAX_LIFETIME_MINUTES: %v", err)
	}

	// Auth config
	tokenExpiryHours, err := strconv.Atoi(getEnv("TOKEN_EXPIRY_HOURS", "24"))
	if err != nil {
		return nil, fmt.Errorf("invalid TOKEN_EXPIRY_HOURS: %v", err)
	}

	restrictDomain, err := strconv.ParseBool(getEnv("RESTRICT_DOMAIN", "false"))
	if err != nil {
		return nil, fmt.Errorf("invalid RESTRICT_DOMAIN: %v", err)
	}

	return &Config{
		Server: ServerConfig{
			GRPCPort: grpcPort,
			HTTPPort: httpPort,
		},
		Database: DatabaseConfig{
			Host:                   getEnv("DB_HOST", "localhost"),
			Port:                   dbPort,
			User:                   getEnv("DB_USER", "postgres"),
			Password:               getEnv("DB_PASSWORD", "postgres"),
			DBName:                 getEnv("DB_NAME", "buganizer"),
			MaxOpenConns:           maxOpenConns,
			MaxIdleConns:           maxIdleConns,
			ConnMaxLifetimeMinutes: connMaxLifetime,
		},
		Auth: AuthConfig{
			JWTSecret:          getEnv("JWT_SECRET", "your-secret-key"),
			TokenExpiryHours:   tokenExpiryHours,
			GoogleClientID:     getEnv("GOOGLE_CLIENT_ID", ""),
			GoogleClientSecret: getEnv("GOOGLE_CLIENT_SECRET", ""),
			RestrictDomain:     restrictDomain,
			AllowedDomain:      getEnv("ALLOWED_DOMAIN", "yourdomain.com"),
		},
		Slack: SlackConfig{
			APIToken:       getEnv("SLACK_API_TOKEN", ""),
			DefaultChannel: getEnv("SLACK_DEFAULT_CHANNEL", "buganizer"),
		},
		Storage: StorageConfig{
			Provider: getEnv("STORAGE_PROVIDER", "local"),
			BasePath: getEnv("STORAGE_BASE_PATH", "./uploads"),
			Bucket:   getEnv("STORAGE_BUCKET", "buganizer-files"),
		},
		BaseURL: getEnv("BASE_URL", "http://localhost:8080"),
	}, nil
}

// getEnv gets an environment variable or returns a default value
func getEnv(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}
