package projects

import (
	"time"

	"github.com/DominikKuenkele/TimeTrack/projects/status"
)

type Project struct {
	ID               int32
	Name             string
	Status           status.Status
	RuntimeInMinutes uint64
	StartedAt        *time.Time
}
