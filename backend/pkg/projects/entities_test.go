package projects

import (
	"testing"
	"time"
)

var base = time.Date(2024, 3, 1, 0, 0, 0, 0, time.UTC)

func at(h, m int) time.Time {
	return base.Add(time.Duration(h)*time.Hour + time.Duration(m)*time.Minute)
}

func act(start time.Time, end *time.Time) *Activity {
	return &Activity{StartedAt: start, EndedAt: end}
}

func ptr(t time.Time) *time.Time { return &t }

func TestCalculateWorktimeAndBreaktime(t *testing.T) {
	tests := []struct {
		name       string
		activities Activities
		worktime   uint64
		breaktime  uint64
	}{
		{name: "no activities"},
		{
			name:       "single finished activity",
			activities: Activities{act(at(9, 0), ptr(at(17, 0)))},
			worktime:   8 * 3600,
		},
		{
			name:       "only a running activity counts nothing",
			activities: Activities{act(at(9, 0), nil)},
		},
		{
			name: "running last activity is ignored for worktime",
			activities: Activities{
				act(at(9, 0), ptr(at(12, 0))),
				act(at(13, 0), nil),
			},
			worktime:  3 * 3600,
			breaktime: 3600,
		},
		{
			name: "lunch break",
			activities: Activities{
				act(at(8, 0), ptr(at(12, 0))),
				act(at(13, 0), ptr(at(17, 0))),
			},
			worktime:  9 * 3600,
			breaktime: 3600,
		},
		{
			name: "back-to-back activities have no break",
			activities: Activities{
				act(at(8, 0), ptr(at(12, 0))),
				act(at(12, 0), ptr(at(16, 0))),
			},
			worktime: 8 * 3600,
		},
		{
			name: "overlapping activities have no break",
			activities: Activities{
				act(at(8, 0), ptr(at(12, 0))),
				act(at(11, 30), ptr(at(16, 0))),
			},
			worktime: 8 * 3600,
		},
		{
			name: "only the longest break counts",
			activities: Activities{
				act(at(8, 0), ptr(at(10, 0))),
				act(at(10, 15), ptr(at(12, 0))),
				act(at(13, 0), ptr(at(15, 0))),
			},
			worktime:  7 * 3600,
			breaktime: 3600,
		},
		{
			name: "break after a running activity is not measured",
			activities: Activities{
				act(at(8, 0), nil),
				act(at(10, 0), ptr(at(11, 0))),
			},
			worktime: 3 * 3600,
		},
		{
			name:       "activity spanning midnight",
			activities: Activities{act(at(22, 0), ptr(at(26, 0)))},
			worktime:   4 * 3600,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			d := DailyActivities{Activities: tt.activities}
			d.CalculateWorktime()
			d.CalculateBreaktime()

			if d.Worktime != tt.worktime {
				t.Errorf("worktime = %d, want %d", d.Worktime, tt.worktime)
			}
			if d.Breaktime != tt.breaktime {
				t.Errorf("breaktime = %d, want %d", d.Breaktime, tt.breaktime)
			}
		})
	}
}

func TestCalculateRuntime(t *testing.T) {
	a := Activities{
		act(at(8, 0), ptr(at(9, 0))),
		act(at(10, 0), ptr(at(10, 30))),
		act(at(11, 0), nil),
	}

	if got := a.CalculateRuntime(); got != 5400 {
		t.Errorf("runtime = %d, want 5400 (running activity excluded)", got)
	}
}
