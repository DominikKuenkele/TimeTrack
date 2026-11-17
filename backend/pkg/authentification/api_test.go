package authentification

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/DominikKuenkele/TimeTrack/libraries/user"
)

func TestIdentify(t *testing.T) {
	tests := []struct {
		name    string
		header  http.Header
		devUser string
		want    string
	}{
		{
			name:   "takes the user from Authentik's uid header",
			header: http.Header{"X-Authentik-Uid": {"abc"}, "X-Authentik-Username": {"alice"}},
			want:   "abc",
		},
		{
			name:    "prefers the header over the dev user",
			header:  http.Header{"X-Authentik-Uid": {"abc"}},
			devUser: "dev",
			want:    "abc",
		},
		{
			name:    "falls back to the dev user without the header",
			header:  http.Header{},
			devUser: "dev",
			want:    "dev",
		},
		{
			name:   "finds no user from the username alone",
			header: http.Header{"X-Authentik-Username": {"alice"}},
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := identify(tt.header, tt.devUser); got != tt.want {
				t.Errorf("identify() = %q, want %q", got, tt.want)
			}
		})
	}
}

func TestAuthenticate(t *testing.T) {
	serve := func(header http.Header) (int, string) {
		var seen string
		handler := NewAPI("").Authenticate(func(w http.ResponseWriter, r *http.Request) {
			seen = user.FromContext(r.Context())
		})
		r := httptest.NewRequest(http.MethodGet, "/projects/", nil)
		r.Header = header
		w := httptest.NewRecorder()
		handler(w, r)
		return w.Code, seen
	}

	if code, seen := serve(http.Header{"X-Authentik-Uid": {"abc"}}); code != http.StatusOK || seen != "abc" {
		t.Errorf("with the header: code = %d, user = %q, want 200 and abc", code, seen)
	}
	if code, seen := serve(http.Header{}); code != http.StatusUnauthorized || seen != "" {
		t.Errorf("without the header: code = %d, user = %q, want 401 and no call", code, seen)
	}
}
