package activities

import (
	"context"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/DominikKuenkele/TimeTrack/libraries/user"
	"github.com/DominikKuenkele/TimeTrack/projects"
)

type fakeHandler struct {
	err     error
	userID  string
	day     time.Time
	changed *projects.Activity
	calls   int
}

func (f *fakeHandler) GetDailyActivities(ctx context.Context, day time.Time) (projects.DailyActivities, error) {
	f.calls++
	f.userID, f.day = user.FromContext(ctx), day
	return projects.DailyActivities{Overtime: 42}, f.err
}

func (f *fakeHandler) ChangeActivity(ctx context.Context, activity projects.Activity) error {
	f.calls++
	f.userID, f.changed = user.FromContext(ctx), &activity
	return f.err
}

func do(h *fakeHandler, method, target, body string) *httptest.ResponseRecorder {
	req := httptest.NewRequest(method, target, strings.NewReader(body))
	req = req.WithContext(user.ToContext(req.Context(), "u1"))
	rec := httptest.NewRecorder()
	NewAPI(nopLogger{}, h).HTTPHandler(rec, req)

	return rec
}

func TestAPIGetDay(t *testing.T) {
	h := &fakeHandler{}
	rec := do(h, http.MethodGet, "/activities?day=2024-03-01", "")

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d", rec.Code)
	}
	if !h.day.Equal(base) || h.userID != "u1" {
		t.Errorf("handler got user %q day %v", h.userID, h.day)
	}
	if !strings.Contains(rec.Body.String(), `"overtime":42`) {
		t.Errorf("body = %s", rec.Body.String())
	}
}

func TestAPIInvalidInput(t *testing.T) {
	tests := []struct{ name, method, target, body string }{
		{"missing day", http.MethodGet, "/activities", ""},
		{"malformed day", http.MethodGet, "/activities?day=01.03.2024", ""},
		{"non-numeric id", http.MethodPost, "/activities/abc", `{"projectName":"p","startedAt":"2024-03-01T08:00:00Z"}`},
		{"unknown action", http.MethodPost, "/activities/1/foo", ""},
		{"malformed body", http.MethodPost, "/activities/1", `{`},
		{"missing project name", http.MethodPost, "/activities/1", `{"startedAt":"2024-03-01T08:00:00Z"}`},
		{"missing startedAt", http.MethodPost, "/activities/1", `{"projectName":"p"}`},
		{"end before start", http.MethodPost, "/activities/1", `{"projectName":"p","startedAt":"2024-03-01T08:00:00Z","endedAt":"2024-03-01T07:00:00Z"}`},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			h := &fakeHandler{}
			rec := do(h, tt.method, tt.target, tt.body)

			if rec.Code != http.StatusBadRequest {
				t.Errorf("status = %d, want %d", rec.Code, http.StatusBadRequest)
			}
			if h.calls != 0 {
				t.Error("handler must not be called")
			}
		})
	}
}

func TestAPIChangeActivity(t *testing.T) {
	tests := []struct {
		name    string
		body    string
		running bool
	}{
		{"finished", `{"projectName":"p","startedAt":"2024-03-01T08:00:00Z","endedAt":"2024-03-01T09:00:00Z"}`, false},
		{"running", `{"projectName":"p","startedAt":"2024-03-01T08:00:00Z","endedAt":null}`, true},
		{"zero length", `{"projectName":"p","startedAt":"2024-03-01T08:00:00Z","endedAt":"2024-03-01T08:00:00Z"}`, false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			h := &fakeHandler{}
			rec := do(h, http.MethodPost, "/activities/12", tt.body)

			if rec.Code != http.StatusOK {
				t.Fatalf("status = %d, body %s", rec.Code, rec.Body.String())
			}
			if h.changed == nil || h.changed.ID != 12 || h.changed.ProjectName != "p" || !h.changed.StartedAt.Equal(*at(8, 0)) {
				t.Errorf("changed = %+v", h.changed)
			}
			if (h.changed.EndedAt == nil) != tt.running {
				t.Errorf("endedAt = %v", h.changed.EndedAt)
			}
			if h.userID != "u1" {
				t.Errorf("user = %q", h.userID)
			}
		})
	}
}

// The API maps every handler error, including "project not found", to 400.
func TestAPIMapsHandlerErrorsToBadRequest(t *testing.T) {
	h := &fakeHandler{err: errors.New("project p not found")}
	rec := do(h, http.MethodPost, "/activities/1", `{"projectName":"p","startedAt":"2024-03-01T08:00:00Z"}`)

	if rec.Code != http.StatusBadRequest {
		t.Errorf("status = %d, want %d", rec.Code, http.StatusBadRequest)
	}
	if !strings.Contains(rec.Body.String(), "project p not found") {
		t.Errorf("body = %s", rec.Body.String())
	}
}

func TestAPIRejectsWrongMethods(t *testing.T) {
	for _, method := range []string{http.MethodPut, http.MethodDelete, http.MethodPatch} {
		h := &fakeHandler{}
		rec := do(h, method, "/activities/1", "")

		if rec.Code != http.StatusMethodNotAllowed {
			t.Errorf("%s: status = %d, want %d", method, rec.Code, http.StatusMethodNotAllowed)
		}
		if h.calls != 0 {
			t.Errorf("%s: handler must not be called", method)
		}
	}
}
