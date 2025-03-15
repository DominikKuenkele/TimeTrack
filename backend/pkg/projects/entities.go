package projects

import (
	"time"
)

type Project struct {
	ID               int32
	Name             string
	RuntimeInSeconds uint64
	StartedAt        *time.Time
	CreatedAt        *time.Time
	UpdatedAt        *time.Time
}
