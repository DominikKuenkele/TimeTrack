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

type DailyActivities struct {
	Activities Activities `json:"activities"`
	Breaktime  uint64     `json:"breaktime"`
	Worktime   uint64     `json:"worktime"`
}

func (d *DailyActivities) CalculateWorktime() {
	if len(d.Activities) == 0 {
		d.Worktime = 0
		return
	}

	startedAt := d.Activities[0].StartedAt
	endedAt := d.Activities[0].EndedAt
	for i := len(d.Activities) - 1; i >= 0; i-- {
		if d.Activities[i].EndedAt != nil {
			endedAt = d.Activities[i].EndedAt
			break
		}
	}

	if endedAt == nil {
		d.Worktime = 0
		return
	}

	d.Worktime = uint64(endedAt.Sub(startedAt).Seconds())
}

func (d *DailyActivities) CalculateBreaktime() {
	if len(d.Activities) < 2 {
		d.Breaktime = 0
		return
	}

	var maxBreak uint64
	for i := 1; i < len(d.Activities); i++ {
		prev := d.Activities[i-1]
		curr := d.Activities[i]

		if prev.EndedAt != nil {
			var breakTime uint64
			if curr.StartedAt.After(*prev.EndedAt) {
				breakTime = uint64(curr.StartedAt.Sub(*prev.EndedAt).Seconds())
			}
			if breakTime > maxBreak {
				maxBreak = breakTime
			}
		}
	}

	d.Breaktime = maxBreak
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
