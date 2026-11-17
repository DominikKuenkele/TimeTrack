package authentification

import (
	"net/http"

	"github.com/DominikKuenkele/TimeTrack/libraries/user"
)

const uidHeader = "X-authentik-uid"

type API interface {
	Authenticate(next http.HandlerFunc) http.HandlerFunc
}

type apiImpl struct {
	devUser string
}

var _ API = &apiImpl{}

func NewAPI(devUser string) API {
	return &apiImpl{devUser: devUser}
}

// Authentik's forward auth in front of the app signs the user in and passes them in headers.
func (a *apiImpl) Authenticate(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		uid := identify(r.Header, a.devUser)
		if uid == "" {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		next.ServeHTTP(w, r.WithContext(user.ToContext(r.Context(), uid)))
	}
}

func identify(header http.Header, devUser string) string {
	if uid := header.Get(uidHeader); uid != "" {
		return uid
	}
	return devUser
}
