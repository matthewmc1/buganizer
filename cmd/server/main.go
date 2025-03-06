// cmd/server/main.go
package main

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"net"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/grpc-ecosystem/grpc-gateway/v2/runtime"
	_ "github.com/lib/pq"
	"google.golang.org/grpc"
	"google.golang.org/grpc/reflection"

	"github.com/mmcgibbon1/buganizer/config"
	"github.com/mmcgibbon1/buganizer/middleware"
	pb "github.com/mmcgibbon1/buganizer/proto"
	"github.com/mmcgibbon1/buganizer/repositories/postgres"
	"github.com/mmcgibbon1/buganizer/services/auth"
	"github.com/mmcgibbon1/buganizer/services/issue"
	"github.com/mmcgibbon1/buganizer/services/notification"
	"github.com/mmcgibbon1/buganizer/services/search"
	"github.com/mmcgibbon1/buganizer/services/sla"
)

func main() {
	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	// Connect to database
	db, err := setupDatabase(cfg)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer db.Close()

	// Initialize repositories
	repos := initRepositories(db)

	// Create gRPC server
	grpcServer := setupGRPCServer(cfg, repos)

	// Start gRPC server
	go startGRPCServer(grpcServer, cfg.Server.GRPCPort)

	// Start HTTP gateway
	go startHTTPGateway(cfg, repos)

	// Wait for termination signal
	waitForTermination(grpcServer)
}

// setupDatabase connects to the database
func setupDatabase(cfg *config.Config) (*sql.DB, error) {
	connStr := fmt.Sprintf(
		"host=%s port=%d user=%s password=%s dbname=%s sslmode=disable",
		cfg.Database.Host,
		cfg.Database.Port,
		cfg.Database.User,
		cfg.Database.Password,
		cfg.Database.DBName,
	)

	db, err := sql.Open("postgres", connStr)
	if err != nil {
		return nil, err
	}

	// Set connection pool settings
	db.SetMaxOpenConns(cfg.Database.MaxOpenConns)
	db.SetMaxIdleConns(cfg.Database.MaxIdleConns)
	db.SetConnMaxLifetime(time.Duration(cfg.Database.ConnMaxLifetimeMinutes) * time.Minute)

	// Test connection
	if err := db.Ping(); err != nil {
		return nil, err
	}

	return db, nil
}

// Repositories holds all repository implementations
type Repositories struct {
	IssueRepo      *postgres.IssueRepository
	CommentRepo    *postgres.CommentRepository
	AttachmentRepo *postgres.AttachmentRepository
	UserRepo       *postgres.UserRepository
	TeamRepo       *postgres.TeamRepository
	ComponentRepo  *postgres.ComponentRepository
	ViewRepo       *postgres.ViewRepository
	WebhookRepo    *postgres.WebhookRepository
	PreferenceRepo *postgres.NotificationPreferenceRepository
}

// initRepositories initializes all repositories
func initRepositories(db *sql.DB) *Repositories {
	return &Repositories{
		IssueRepo:      postgres.NewIssueRepository(db),
		CommentRepo:    postgres.NewCommentRepository(db),
		AttachmentRepo: postgres.NewAttachmentRepository(db),
		UserRepo:       postgres.NewUserRepository(db),
		TeamRepo:       postgres.NewTeamRepository(db),
		ComponentRepo:  postgres.NewComponentRepository(db),
		ViewRepo:       postgres.NewViewRepository(db),
		WebhookRepo:    postgres.NewWebhookRepository(db),
		PreferenceRepo: postgres.NewNotificationPreferenceRepository(db),
	}
}

// setupGRPCServer sets up the gRPC server with all services
func setupGRPCServer(cfg *config.Config, repos *Repositories) *grpc.Server {
	// Create auth interceptor
	authInterceptor := middleware.NewAuthInterceptor(cfg)

	// Create gRPC server with interceptors
	grpcServer := grpc.NewServer(
		grpc.UnaryInterceptor(authInterceptor.Unary()),
		grpc.StreamInterceptor(authInterceptor.Stream()),
	)

	// Create services
	authService := auth.NewService(repos.UserRepo, cfg)

	// Create notification service (needed by other services)
	notifService := notification.NewService(
		repos.WebhookRepo,
		repos.UserRepo,
		repos.IssueRepo,
		repos.PreferenceRepo,
		cfg,
	)

	// Create SLA service (needed by issue service)
	slaService := sla.NewService(
		repos.IssueRepo,
		repos.ComponentRepo,
		&pb.NotificationServiceClient{}, // This will be set after services are registered
	)

	// Create issue service
	issueService := issue.NewService(
		repos.IssueRepo,
		repos.CommentRepo,
		repos.AttachmentRepo,
		&pb.SLAServiceClient{},          // This will be set after services are registered
		&pb.NotificationServiceClient{}, // This will be set after services are registered
	)

	// Create search service
	searchService := search.NewService(
		repos.IssueRepo,
		repos.ViewRepo,
		repos.UserRepo,
	)

	// Register services
	pb.RegisterAuthServiceServer(grpcServer, authService)
	pb.RegisterNotificationServiceServer(grpcServer, notifService)
	pb.RegisterSLAServiceServer(grpcServer, slaService)
	pb.RegisterIssueServiceServer(grpcServer, issueService)
	pb.RegisterSearchServiceServer(grpcServer, searchService)

	// Enable reflection for development tools
	reflection.Register(grpcServer)

	return grpcServer
}

// startGRPCServer starts the gRPC server
func startGRPCServer(grpcServer *grpc.Server, port int) {
	lis, err := net.Listen("tcp", fmt.Sprintf(":%d", port))
	if err != nil {
		log.Fatalf("Failed to listen: %v", err)
	}

	log.Printf("Starting gRPC server on port %d", port)
	if err := grpcServer.Serve(lis); err != nil {
		log.Fatalf("Failed to serve: %v", err)
	}
}

// startHTTPGateway starts the HTTP gateway
func startHTTPGateway(cfg *config.Config, repos *Repositories) {
	ctx := context.Background()
	ctx, cancel := context.WithCancel(ctx)
	defer cancel()

	// Create a client connection to the gRPC server
	conn, err := grpc.DialContext(
		ctx,
		fmt.Sprintf("localhost:%d", cfg.Server.GRPCPort),
		grpc.WithInsecure(),
	)
	if err != nil {
		log.Fatalf("Failed to dial server: %v", err)
	}
	defer conn.Close()

	// Create a new ServeMux
	gwmux := runtime.NewServeMux()

	// Register handlers
	err = pb.RegisterAuthServiceHandler(ctx, gwmux, conn)
	if err != nil {
		log.Fatalf("Failed to register gateway: %v", err)
	}

	err = pb.RegisterIssueServiceHandler(ctx, gwmux, conn)
	if err != nil {
		log.Fatalf("Failed to register gateway: %v", err)
	}

	err = pb.RegisterSLAServiceHandler(ctx, gwmux, conn)
	if err != nil {
		log.Fatalf("Failed to register gateway: %v", err)
	}

	err = pb.RegisterNotificationServiceHandler(ctx, gwmux, conn)
	if err != nil {
		log.Fatalf("Failed to register gateway: %v", err)
	}

	err = pb.RegisterSearchServiceHandler(ctx, gwmux, conn)
	if err != nil {
		log.Fatalf("Failed to register gateway: %v", err)
	}

	// Serve the gateway
	addr := fmt.Sprintf(":%d", cfg.Server.HTTPPort)
	log.Printf("Starting HTTP gateway on port %d", cfg.Server.HTTPPort)
	log.Fatal(http.ListenAndServe(addr, cors(gwmux)))
}

// cors is a middleware that adds CORS headers to the response
func cors(h http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		h.ServeHTTP(w, r)
	})
}

// waitForTermination waits for termination signals and gracefully shuts down
func waitForTermination(grpcServer *grpc.Server) {
	// Create a channel to receive OS signals
	c := make(chan os.Signal, 1)
	signal.Notify(c, os.Interrupt, syscall.SIGTERM)

	// Block until a signal is received
	sig := <-c
	log.Printf("Received signal: %v", sig)

	// Gracefully stop the server
	log.Println("Shutting down server...")
	grpcServer.GracefulStop()
}
