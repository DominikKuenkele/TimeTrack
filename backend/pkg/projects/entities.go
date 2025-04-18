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
	CreatedAt        time.Time  `json:"createdAt"`
	UpdatedAt        time.Time  `json:"updatedAt"`
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
	StartedAt sql.NullTime
	CreatedAt time.Time
	UpdatedAt time.Time
}

func (p *DbProject) ToDomain() *Project {
	project := &Project{
		ID:        p.ID,
		UserID:    p.UserID,
		Name:      p.Name,
		CreatedAt: p.CreatedAt.Local(),
		UpdatedAt: p.UpdatedAt.Local(),
	}

	if p.StartedAt.Valid {
		localStartedAt := p.StartedAt.Time.Local()
		project.StartedAt = &localStartedAt
	}

	return project
}

type Activity struct {
	ID          int        `json:"id"`
	ProjectName string     `json:"projectName"`
	StartedAt   time.Time  `json:"startedAt"`
	EndedAt     *time.Time `json:"endedAt"`
	CreatedAt   time.Time  `json:"createdAt"`
	UpdatedAt   time.Time  `json:"updatesAt"`
}

type Activities []*Activity

func (a Activities) CalculateRuntime() uint64 {
	var runtime uint64
	for _, activity := range a {
		if activity.EndedAt != nil {
			runtime += uint64(activity.EndedAt.Sub(activity.StartedAt).Seconds())
		}
	}

	return runtime
}

type DbActivity struct {
	ID          int
	ProjectName string
	StartedAt   time.Time
	EndedAt     sql.NullTime
	CreatedAt   time.Time
	UpdatedAt   time.Time
}

func (a *DbActivity) ToDomain() *Activity {
	activity := &Activity{
		ID:          a.ID,
		ProjectName: a.ProjectName,
		StartedAt:   a.StartedAt.Local(),
		CreatedAt:   a.CreatedAt.Local(),
		UpdatedAt:   a.UpdatedAt.Local(),
	}

	if a.EndedAt.Valid && !a.EndedAt.Time.IsZero() {
		localEndedAt := a.EndedAt.Time.Local()
		activity.EndedAt = &localEndedAt
	}

	return activity
}
