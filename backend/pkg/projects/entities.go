package projects

import (
	"database/sql"
	"time"
)

type Project struct {
	ID               int        `json:"id"`
	UserID           string     `json:"userID"`
	Name             string     `json:"name"`
	RuntimeInSeconds uint64     `json:"runtimeInSeconds"`
	StartedAt        *time.Time `json:"startedAt"`
	Activities       Activities `json:"activities"`
	CreatedAt        *time.Time `json:"createdAt"`
	UpdatedAt        *time.Time `json:"updatedAt"`
}

func (p *Project) DatesToLocal() {
	if p.CreatedAt != nil {
		*p.CreatedAt = p.CreatedAt.Local()
	}
	if p.UpdatedAt != nil {
		*p.UpdatedAt = p.UpdatedAt.Local()
	}
}

type Activity struct {
	ID        int        `json:"id"`
	StartedAt *time.Time `json:"startedAt"`
	EndedAt   *time.Time `json:"endedAt"`
	CreatedAt *time.Time `json:"createdAt"`
	UpdatedAt *time.Time `json:"updatesAt"`
}

func (a *Activity) DatesToLocal() {
	if a.StartedAt != nil {
		*a.StartedAt = a.StartedAt.Local()
	}
	if a.EndedAt != nil {
		*a.EndedAt = a.EndedAt.Local()
	}
	if a.CreatedAt != nil {
		*a.CreatedAt = a.CreatedAt.Local()
	}
	if a.UpdatedAt != nil {
		*a.UpdatedAt = a.UpdatedAt.Local()
	}
}

type Activities []*Activity

func (a Activities) CalculateRuntime() uint64 {
	var runtime uint64
	for _, activity := range a {
		if activity.StartedAt != nil && activity.EndedAt != nil {
			runtime += uint64(activity.EndedAt.Sub(*activity.StartedAt).Seconds())
		}
	}

	return runtime
}

type PaginatedProjects struct {
	ActiveProject *Project   `json:"activeProject,omitempty"`
	Projects      []*Project `json:"projects"`
	Total         int        `json:"total"`
	Page          int        `json:"page"`
	PerPage       int        `json:"perPage"`
	TotalPages    int        `json:"totalPages"`
}

type DbProject struct {
	ID        int
	UserID    string
	Name      string
	StartedAt *time.Time
	CreatedAt *time.Time
	UpdatedAt *time.Time
}

func (p *DbProject) ToDomain() *Project {
	return &Project{
		ID:        p.ID,
		UserID:    p.UserID,
		Name:      p.Name,
		StartedAt: p.StartedAt,
		CreatedAt: p.CreatedAt,
		UpdatedAt: p.UpdatedAt,
	}
}

type DbActivity struct {
	ID        int
	ProjectID int
	StartedAt sql.NullTime
	EndedAt   sql.NullTime
	CreatedAt *time.Time
	UpdatedAt *time.Time
}

func (a *DbActivity) ToDomain() *Activity {
	activity := &Activity{
		ID:        a.ID,
		CreatedAt: a.CreatedAt,
		UpdatedAt: a.UpdatedAt,
	}
	if a.StartedAt.Valid {
		activity.StartedAt = &a.StartedAt.Time
	}
	if a.EndedAt.Valid {
		activity.EndedAt = &a.EndedAt.Time
	}

	return activity
}
