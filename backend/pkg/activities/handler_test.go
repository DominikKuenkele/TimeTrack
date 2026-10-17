package activities

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/DominikKuenkele/TimeTrack/libraries/user"
	"github.com/DominikKuenkele/TimeTrack/projects"
)

type nopLogger struct{}

func (nopLogger) Log(string, ...any)     {}
func (nopLogger) Debug(string, ...any)   {}
func (nopLogger) Info(string, ...any)    {}
func (nopLogger) Warning(string, ...any) {}
func (nopLogger) Error(string, ...any)   {}
func (nopLogger) LogAndAbstractError(msg string, _ string, _ ...any) error {
	return errors.New(msg)
}

type fakeRepository struct {
	projects.Repository
	activities  projects.Activities
	worktime    []*projects.Worktime
	activitiesE error
	worktimeE   error
	changeE     error

	userID  string
	day     time.Time
	changed *projects.Activity
}

func (f *fakeRepository) GetActivities(userID string, day time.Time) (projects.Activities, error) {
	f.userID, f.day = userID, day
	return f.activities, f.activitiesE
}

func (f *fakeRepository) GetWorktime(userID string) ([]*projects.Worktime, error) {
	return f.worktime, f.worktimeE
}

func (f *fakeRepository) ChangeActivity(userID string, activity projects.Activity) error {
	f.userID, f.changed = userID, &activity
	return f.changeE
}

var base = time.Date(2024, 3, 1, 0, 0, 0, 0, time.UTC)

func at(h, m int) *time.Time {
	t := base.Add(time.Duration(h)*time.Hour + time.Duration(m)*time.Minute)
	return &t
}

func ctxFor(userID string) context.Context {
	return user.ToContext(context.Background(), userID)
}

func day(worktimeHours, breakHours uint) *projects.Worktime {
	return &projects.Worktime{Worktime: worktimeHours * 3600, Breaktime: breakHours * 3600}
}

func TestCalculateOvertime(t *testing.T) {
	tests := []struct {
		name     string
		worktime []*projects.Worktime
		want     int64
	}{
		{"no days", nil, 0},
		{"exactly a working day", []*projects.Worktime{day(9, 1)}, 0},
		{"overtime", []*projects.Worktime{day(10, 1)}, 3600},
		{"undertime", []*projects.Worktime{day(6, 0)}, -2 * 3600},
		{"break longer than worktime", []*projects.Worktime{day(0, 1)}, -9 * 3600},
		{"day without activities", []*projects.Worktime{day(0, 0)}, -8 * 3600},
		{"overtime and undertime cancel out", []*projects.Worktime{day(10, 0), day(6, 0)}, 0},
		{"sums over all days", []*projects.Worktime{day(9, 0), day(9, 0), day(7, 0)}, 3600},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := calculateOvertime(tt.worktime); got != tt.want {
				t.Errorf("overtime = %d, want %d", got, tt.want)
			}
		})
	}
}

func TestGetDailyActivities(t *testing.T) {
	repo := &fakeRepository{
		activities: projects.Activities{
			{StartedAt: *at(8, 0), EndedAt: at(12, 0)},
			{StartedAt: *at(13, 0), EndedAt: at(18, 0)},
		},
		worktime: []*projects.Worktime{day(10, 1), day(7, 0)},
	}
	h := NewHandler(nopLogger{}, repo)

	got, err := h.GetDailyActivities(ctxFor("u1"), base)
	if err != nil {
		t.Fatal(err)
	}

	if got.Worktime != 10*3600 || got.Breaktime != 3600 {
		t.Errorf("worktime/breaktime = %d/%d, want %d/%d", got.Worktime, got.Breaktime, 10*3600, 3600)
	}
	if want := int64(9*3600-8*3600) + int64(7*3600-8*3600); got.Overtime != want {
		t.Errorf("overtime = %d, want %d", got.Overtime, want)
	}
	if len(got.Activities) != 2 {
		t.Errorf("activities = %d, want 2", len(got.Activities))
	}
	if repo.userID != "u1" || !repo.day.Equal(base) {
		t.Errorf("repository got user %q day %v", repo.userID, repo.day)
	}
}

func TestGetDailyActivitiesWithoutActivities(t *testing.T) {
	h := NewHandler(nopLogger{}, &fakeRepository{worktime: []*projects.Worktime{day(9, 0)}})

	got, err := h.GetDailyActivities(ctxFor("u1"), base)
	if err != nil {
		t.Fatal(err)
	}
	if got.Worktime != 0 || got.Breaktime != 0 || got.Overtime != 3600 {
		t.Errorf("got %+v", got)
	}
}

func TestGetDailyActivitiesErrors(t *testing.T) {
	repoErr := errors.New("boom")

	if _, err := NewHandler(nopLogger{}, &fakeRepository{}).GetDailyActivities(ctxFor("u1"), time.Time{}); err == nil {
		t.Error("zero day must be rejected")
	}
	if _, err := NewHandler(nopLogger{}, &fakeRepository{activitiesE: repoErr}).GetDailyActivities(ctxFor("u1"), base); !errors.Is(err, repoErr) {
		t.Errorf("activities error = %v", err)
	}
	if _, err := NewHandler(nopLogger{}, &fakeRepository{worktimeE: repoErr}).GetDailyActivities(ctxFor("u1"), base); !errors.Is(err, repoErr) {
		t.Errorf("worktime error = %v", err)
	}
}

func TestChangeActivityPassesUserAndActivity(t *testing.T) {
	repo := &fakeRepository{}
	h := NewHandler(nopLogger{}, repo)

	if err := h.ChangeActivity(ctxFor("u2"), projects.Activity{ID: 7, ProjectName: "p"}); err != nil {
		t.Fatal(err)
	}
	if repo.userID != "u2" || repo.changed == nil || repo.changed.ID != 7 || repo.changed.ProjectName != "p" {
		t.Errorf("repository got user %q activity %+v", repo.userID, repo.changed)
	}

	repo.changeE = errors.New("boom")
	if err := h.ChangeActivity(ctxFor("u2"), projects.Activity{}); !errors.Is(err, repo.changeE) {
		t.Errorf("error = %v", err)
	}
}
