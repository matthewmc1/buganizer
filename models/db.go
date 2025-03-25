// models/db.go
package models

import (
	"database/sql" // or your preferred database driver
)

// Global DB variable to be initialized in main.go
var DB *sql.DB
