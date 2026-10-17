package projects

import (
	"context"
	"errors"
	"fmt"
	"reflect"
	"testing"
	"time"

	"github.com/DominikKuenkele/TimeTrack/libraries/user"
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

// fakeRepository records the calls that reach it and returns canned data.
type fakeRepository struct {
	Repository
	projects []*Project
	err      error
	calls    []string
}

func (f *fakeRepository) call(op, userID, name string) {
	f.calls = append(f.calls, fmt.Sprintf("%s:%s:%s", op, userID, name))
}

func (f *fakeRepository) AddProject(userID, name string) error {
	f.call("add", userID, name)
	return f.err
}

func (f *fakeRepository) DeleteProject(userID, name string) error {
	f.call("delete", userID, name)
	return f.err
}

func (f *fakeRepository) StartProject(userID, name string) error {
	f.call("start", userID, name)
	return f.err
}

func (f *fakeRepository) StopProject(userID, name string) error {
	f.call("stop", userID, name)
	return f.err
}

func (f *fakeRepository) GetProject(userID, name string) (*Project, error) {
	f.call("get", userID, name)
	return &Project{Name: name}, f.err
}

func (f *fakeRepository) GetProjectsLike(userID, searchTerm string) ([]*Project, error) {
	f.call("like", userID, searchTerm)
	return f.projects, f.err
}

func ctxFor(userID string) context.Context {
	return user.ToContext(context.Background(), userID)
}

func TestHandlerRejectsEmptyName(t *testing.T) {
	ops := map[string]func(h Handler, ctx context.Context) error{
		"add":    func(h Handler, ctx context.Context) error { return h.Add(ctx, "") },
		"delete": func(h Handler, ctx context.Context) error { return h.Delete(ctx, "") },
		"start":  func(h Handler, ctx context.Context) error { return h.StartProject(ctx, "") },
		"stop":   func(h Handler, ctx context.Context) error { return h.StopProject(ctx, "") },
		"get": func(h Handler, ctx context.Context) error {
			_, err := h.Get(ctx, "")
			return err
		},
	}

	for name, op := range ops {
		t.Run(name, func(t *testing.T) {
			repo := &fakeRepository{}
			if err := op(NewHandler(nopLogger{}, repo), ctxFor("u1")); err == nil {
				t.Error("expected an error")
			}
			if len(repo.calls) != 0 {
				t.Errorf("repository must not be called, got %v", repo.calls)
			}
		})
	}
}

func TestHandlerPassesUserAndNameToRepository(t *testing.T) {
	repo := &fakeRepository{}
	h := NewHandler(nopLogger{}, repo)
	ctx := ctxFor("u1")

	_ = h.Add(ctx, "a")
	_ = h.Delete(ctx, "b")
	_ = h.StartProject(ctx, "c")
	_ = h.StopProject(ctx, "d")
	_, _ = h.Get(ctx, "e")
	_, _ = h.GetAll(ctx)
	_, _ = h.GetAllLike(ctx, "f")

	want := []string{"add:u1:a", "delete:u1:b", "start:u1:c", "stop:u1:d", "get:u1:e", "like:u1:", "like:u1:f"}
	if !reflect.DeepEqual(repo.calls, want) {
		t.Errorf("calls = %v, want %v", repo.calls, want)
	}
}

func TestHandlerReturnsRepositoryError(t *testing.T) {
	repoErr := errors.New("boom")
	h := NewHandler(nopLogger{}, &fakeRepository{err: repoErr})

	if err := h.Add(ctxFor("u1"), "a"); !errors.Is(err, repoErr) {
		t.Errorf("Add error = %v, want %v", err, repoErr)
	}
	if _, err := h.GetPaginatedLike(ctxFor("u1"), 1, 2, ""); !errors.Is(err, repoErr) {
		t.Errorf("GetPaginatedLike error = %v, want %v", err, repoErr)
	}
}

func projectList(names ...string) []*Project {
	var res []*Project
	for _, n := range names {
		res = append(res, &Project{Name: n})
	}
	return res
}

func names(projects []*Project) []string {
	res := []string{}
	for _, p := range projects {
		res = append(res, p.Name)
	}
	return res
}

func TestGetPaginatedLike(t *testing.T) {
	five := projectList("p1", "p2", "p3", "p4", "p5")
	running := &Project{Name: "run", StartedAt: ptr(time.Now())}

	tests := []struct {
		name       string
		projects   []*Project
		page       int
		perPage    int
		want       []string
		total      int
		totalPages int
		active     string
	}{
		{name: "first page", projects: five, page: 1, perPage: 2, want: []string{"p1", "p2"}, total: 5, totalPages: 3},
		{name: "last partial page", projects: five, page: 3, perPage: 2, want: []string{"p5"}, total: 5, totalPages: 3},
		{name: "page beyond last", projects: five, page: 4, perPage: 2, want: []string{}, total: 5, totalPages: 3},
		{name: "page far beyond last", projects: five, page: 100, perPage: 2, want: []string{}, total: 5, totalPages: 3},
		{name: "per page larger than total", projects: five, page: 1, perPage: 50, want: []string{"p1", "p2", "p3", "p4", "p5"}, total: 5, totalPages: 1},
		{name: "exact multiple", projects: five[:4], page: 2, perPage: 2, want: []string{"p3", "p4"}, total: 4, totalPages: 2},
		{name: "empty result has one page", projects: nil, page: 1, perPage: 2, want: []string{}, total: 0, totalPages: 1},
		{
			name:     "active project is separate and on every page",
			projects: append([]*Project{running}, five...),
			page:     2, perPage: 2,
			want: []string{"p3", "p4"}, total: 6, totalPages: 3, active: "run",
		},
		{
			name:     "active project beyond last page",
			projects: append([]*Project{running}, five...),
			page:     9, perPage: 2,
			want: []string{}, total: 6, totalPages: 3, active: "run",
		},
		{
			name:     "only an active project",
			projects: []*Project{running},
			page:     1, perPage: 2,
			want: []string{}, total: 1, totalPages: 1, active: "run",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			h := NewHandler(nopLogger{}, &fakeRepository{projects: tt.projects})

			got, err := h.GetPaginatedLike(ctxFor("u1"), tt.page, tt.perPage, "")
			if err != nil {
				t.Fatal(err)
			}

			if !reflect.DeepEqual(names(got.Projects), tt.want) {
				t.Errorf("projects = %v, want %v", names(got.Projects), tt.want)
			}
			if got.Total != tt.total || got.TotalPages != tt.totalPages {
				t.Errorf("total/pages = %d/%d, want %d/%d", got.Total, got.TotalPages, tt.total, tt.totalPages)
			}
			if got.Page != tt.page || got.PerPage != tt.perPage {
				t.Errorf("page/perPage = %d/%d, want %d/%d", got.Page, got.PerPage, tt.page, tt.perPage)
			}
			if tt.active == "" && got.ActiveProject != nil {
				t.Errorf("unexpected active project %q", got.ActiveProject.Name)
			}
			if tt.active != "" && (got.ActiveProject == nil || got.ActiveProject.Name != tt.active) {
				t.Errorf("active project = %v, want %q", got.ActiveProject, tt.active)
			}
		})
	}
}

func TestGetPaginatedLikePassesSearchTerm(t *testing.T) {
	repo := &fakeRepository{}
	h := NewHandler(nopLogger{}, repo)

	if _, err := h.GetPaginatedLike(ctxFor("u1"), 1, 2, "foo"); err != nil {
		t.Fatal(err)
	}
	if want := []string{"like:u1:foo"}; !reflect.DeepEqual(repo.calls, want) {
		t.Errorf("calls = %v, want %v", repo.calls, want)
	}
}
