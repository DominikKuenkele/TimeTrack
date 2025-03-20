package projects

import (
	"time"
)

type Project struct {
	ID               int32      `json:"id"`
	Name             string     `json:"name"`
	RuntimeInSeconds uint64     `json:"runtimeInSeconds"`
	StartedAt        *time.Time `json:"startedAt"`
	CreatedAt        *time.Time `json:"createdAt"`
	UpdatedAt        *time.Time `json:"updatedAt"`
}

func (p *Project) DatesToLocal() {
	if p.StartedAt != nil {
		*p.StartedAt = p.StartedAt.Local()
	}
	if p.CreatedAt != nil {
		*p.CreatedAt = p.CreatedAt.Local()
	}
	if p.UpdatedAt != nil {
		*p.UpdatedAt = p.UpdatedAt.Local()
	}
}

type PaginatedProjects struct {
	ActiveProject *Project   `json:"activeProject,omitempty"`
	Projects      []*Project `json:"projects"`
	Total         int        `json:"total"`
	Page          int        `json:"page"`
	PerPage       int        `json:"perPage"`
	TotalPages    int        `json:"totalPages"`
}
