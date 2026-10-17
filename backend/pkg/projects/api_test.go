package projects

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"reflect"
	"testing"

	"github.com/DominikKuenkele/TimeTrack/libraries/user"
)

// fakeHandler records the calls the API makes to the Handler.
type fakeHandler struct {
	Handler
	err      error
	calls    []string
	users    []string
	page     int
	perPage  int
	search   string
	project  *Project
	paginate *PaginatedProjects
}

func (f *fakeHandler) record(ctx context.Context, call string) {
	f.calls = append(f.calls, call)
	f.users = append(f.users, user.FromContext(ctx))
}

func (f *fakeHandler) Add(ctx context.Context, name string) error {
	f.record(ctx, "add:"+name)
	return f.err
}

func (f *fakeHandler) Delete(ctx context.Context, name string) error {
	f.record(ctx, "delete:"+name)
	return f.err
}

func (f *fakeHandler) StartProject(ctx context.Context, name string) error {
	f.record(ctx, "start:"+name)
	return f.err
}

func (f *fakeHandler) StopProject(ctx context.Context, name string) error {
	f.record(ctx, "stop:"+name)
	return f.err
}

func (f *fakeHandler) Get(ctx context.Context, name string) (*Project, error) {
	f.record(ctx, "get:"+name)
	return f.project, f.err
}

func (f *fakeHandler) GetPaginatedLike(ctx context.Context, page, perPage int, searchTerm string) (*PaginatedProjects, error) {
	f.record(ctx, "list")
	f.page, f.perPage, f.search = page, perPage, searchTerm
	return f.paginate, f.err
}

func do(h *fakeHandler, method, target string) *httptest.ResponseRecorder {
	req := httptest.NewRequest(method, target, nil)
	req = req.WithContext(user.ToContext(req.Context(), "u1"))
	rec := httptest.NewRecorder()
	NewAPI(nopLogger{}, h).HTTPHandler(rec, req)

	return rec
}

func TestAPIRouting(t *testing.T) {
	tests := []struct {
		method, target string
		status         int
		call           string
	}{
		{http.MethodPost, "/projects/foo", http.StatusCreated, "add:foo"},
		{http.MethodDelete, "/projects/foo", http.StatusOK, "delete:foo"},
		{http.MethodGet, "/projects/foo", http.StatusOK, "get:foo"},
		{http.MethodPost, "/projects/foo/start", http.StatusOK, "start:foo"},
		{http.MethodPost, "/projects/foo/stop", http.StatusOK, "stop:foo"},
		{http.MethodGet, "/projects", http.StatusOK, "list"},
		{http.MethodPost, "/projects/my%20project", http.StatusCreated, "add:my project"},
		// decoded once only
		{http.MethodPost, "/projects/a%2541", http.StatusCreated, "add:a%41"},
		{http.MethodPost, "/projects/100%25", http.StatusCreated, "add:100%"},
		{http.MethodPost, "/projects/a%2541/start", http.StatusOK, "start:a%41"},
		// an encoded slash is part of the name, which the handler rejects, not a path separator
		{http.MethodPost, "/projects/x%2Fstart", http.StatusCreated, "add:x/start"},
	}

	for _, tt := range tests {
		t.Run(tt.method+" "+tt.target, func(t *testing.T) {
			h := &fakeHandler{project: &Project{}, paginate: &PaginatedProjects{}}
			rec := do(h, tt.method, tt.target)

			if rec.Code != tt.status {
				t.Errorf("status = %d, want %d", rec.Code, tt.status)
			}
			if !reflect.DeepEqual(h.calls, []string{tt.call}) {
				t.Errorf("calls = %v, want [%s]", h.calls, tt.call)
			}
			if !reflect.DeepEqual(h.users, []string{"u1"}) {
				t.Errorf("user in context = %v, want [u1]", h.users)
			}
		})
	}
}

func TestAPIRejectsWrongMethods(t *testing.T) {
	tests := []struct{ method, target string }{
		{http.MethodPut, "/projects/foo"},
		{http.MethodPatch, "/projects"},
		{http.MethodGet, "/projects/foo/start"},
		{http.MethodDelete, "/projects/foo/start"},
		{http.MethodGet, "/projects/foo/stop"},
		{http.MethodPut, "/projects/foo/stop"},
	}

	for _, tt := range tests {
		t.Run(tt.method+" "+tt.target, func(t *testing.T) {
			h := &fakeHandler{}
			rec := do(h, tt.method, tt.target)

			if rec.Code != http.StatusMethodNotAllowed {
				t.Errorf("status = %d, want %d", rec.Code, http.StatusMethodNotAllowed)
			}
			if len(h.calls) != 0 {
				t.Errorf("handler must not be called, got %v", h.calls)
			}
		})
	}
}

func TestAPIInvalidInput(t *testing.T) {
	tests := []struct{ method, target string }{
		{http.MethodGet, "/projects?page=0"},
		{http.MethodGet, "/projects?page=-1"},
		{http.MethodGet, "/projects?page=abc"},
		{http.MethodGet, "/projects?per_page=0"},
		{http.MethodGet, "/projects?per_page=x"},
		{http.MethodPost, "/projects/foo/unknown"},
	}

	for _, tt := range tests {
		t.Run(tt.method+" "+tt.target, func(t *testing.T) {
			h := &fakeHandler{}
			rec := do(h, tt.method, tt.target)

			if rec.Code != http.StatusBadRequest {
				t.Errorf("status = %d, want %d", rec.Code, http.StatusBadRequest)
			}
			if len(h.calls) != 0 {
				t.Errorf("handler must not be called, got %v", h.calls)
			}
		})
	}
}

func TestAPIPaginationParameters(t *testing.T) {
	h := &fakeHandler{paginate: &PaginatedProjects{}}
	do(h, http.MethodGet, "/projects")
	if h.page != DefaultPage || h.perPage != DefaultPerPage || h.search != "" {
		t.Errorf("defaults = %d/%d/%q", h.page, h.perPage, h.search)
	}

	do(h, http.MethodGet, "/projects?page=3&per_page=10&search_term=foo+bar")
	if h.page != 3 || h.perPage != 10 || h.search != "foo bar" {
		t.Errorf("params = %d/%d/%q", h.page, h.perPage, h.search)
	}
}

// The API maps every handler error, including "project not found", to 400.
func TestAPIMapsHandlerErrorsToBadRequest(t *testing.T) {
	h := &fakeHandler{err: errors.New("project foo not found")}
	rec := do(h, http.MethodGet, "/projects/foo")

	if rec.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want %d", rec.Code, http.StatusBadRequest)
	}

	var body map[string]string
	if err := json.Unmarshal(rec.Body.Bytes(), &body); err != nil {
		t.Fatal(err)
	}
	if body["error"] != "Invalid Input" || body["message"] != "project foo not found" {
		t.Errorf("body = %v", body)
	}
}

func TestAPIWritesJSONResponse(t *testing.T) {
	h := &fakeHandler{project: &Project{Name: "foo"}}
	rec := do(h, http.MethodGet, "/projects/foo")

	if ct := rec.Header().Get("Content-Type"); ct != "application/json" {
		t.Errorf("content type = %q", ct)
	}
	var got Project
	if err := json.Unmarshal(rec.Body.Bytes(), &got); err != nil || got.Name != "foo" {
		t.Errorf("body = %s (%v)", rec.Body.String(), err)
	}
}
