package authentification

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/DominikKuenkele/TimeTrack/libraries/logger"
	"github.com/DominikKuenkele/TimeTrack/libraries/user"
)

func TestIdentify(t *testing.T) {
	tests := []struct {
		name         string
		header       http.Header
		devUser      string
		wantUID      string
		wantUsername string
		wantOK       bool
	}{
		{
			name:         "takes the user from Authentik's headers",
			header:       http.Header{"X-Authentik-Uid": {"abc"}, "X-Authentik-Username": {"alice"}},
			wantUID:      "abc",
			wantUsername: "alice",
			wantOK:       true,
		},
		{
			name:    "prefers the headers over the dev user",
			header:  http.Header{"X-Authentik-Uid": {"abc"}},
			devUser: "dev",
			wantUID: "abc",
			wantOK:  true,
		},
		{
			name:    "falls back to the dev user without headers",
			header:  http.Header{},
			devUser: "dev",
			wantUID: "dev",
			wantOK:  true,
		},
		{
			name:   "rejects a request without headers or dev user",
			header: http.Header{"X-Authentik-Username": {"alice"}},
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			uid, username, ok := identify(tt.header, tt.devUser)
			if uid != tt.wantUID || username != tt.wantUsername || ok != tt.wantOK {
				t.Errorf("identify() = (%q, %q, %v), want (%q, %q, %v)", uid, username, ok, tt.wantUID, tt.wantUsername, tt.wantOK)
			}
		})
	}
}

type fakeHandler struct {
	adoptions [][2]string
	err       error
}

func (f *fakeHandler) AdoptUsernameData(uid, username string) error {
	f.adoptions = append(f.adoptions, [2]string{uid, username})
	return f.err
}

type nopLogger struct{ logger.Logger }

func (nopLogger) Error(string, ...any) {}

func serve(api API, header http.Header) (*httptest.ResponseRecorder, string) {
	var seen string
	handler := api.Authenticate(func(w http.ResponseWriter, r *http.Request) {
		seen = user.FromContext(r.Context())
	})
	r := httptest.NewRequest(http.MethodGet, "/projects/", nil)
	r.Header = header
	w := httptest.NewRecorder()
	handler(w, r)
	return w, seen
}

func TestAuthenticate(t *testing.T) {
	alice := http.Header{"X-Authentik-Uid": {"abc"}, "X-Authentik-Username": {"alice"}}

	t.Run("passes the uid on and adopts the username's data once", func(t *testing.T) {
		handler := &fakeHandler{}
		api := NewAPI(nopLogger{}, handler, "")

		_, first := serve(api, alice)
		_, second := serve(api, alice)

		if first != "abc" || second != "abc" {
			t.Errorf("user = %q, %q, want abc", first, second)
		}
		if len(handler.adoptions) != 1 || handler.adoptions[0] != [2]string{"abc", "alice"} {
			t.Errorf("adoptions = %v, want one of alice to abc", handler.adoptions)
		}
	})

	t.Run("answers 401 without a user", func(t *testing.T) {
		w, seen := serve(NewAPI(nopLogger{}, &fakeHandler{}, ""), http.Header{})

		if w.Code != http.StatusUnauthorized || seen != "" {
			t.Errorf("code = %d, user = %q, want 401 and no call", w.Code, seen)
		}
	})

	t.Run("tries again after a failed adoption", func(t *testing.T) {
		handler := &fakeHandler{err: errTest}
		api := NewAPI(nopLogger{}, handler, "")

		w, seen := serve(api, alice)
		if w.Code != http.StatusInternalServerError || seen != "" {
			t.Errorf("code = %d, user = %q, want 500 and no call", w.Code, seen)
		}

		handler.err = nil
		serve(api, alice)
		if len(handler.adoptions) != 2 {
			t.Errorf("adoptions = %d, want 2", len(handler.adoptions))
		}
	})

	t.Run("adopts nothing for the dev user", func(t *testing.T) {
		handler := &fakeHandler{}
		_, seen := serve(NewAPI(nopLogger{}, handler, "dev"), http.Header{})

		if seen != "dev" || len(handler.adoptions) != 0 {
			t.Errorf("user = %q, adoptions = %v", seen, handler.adoptions)
		}
	})
}

var errTest = testError("broken")

type testError string

func (e testError) Error() string { return string(e) }
