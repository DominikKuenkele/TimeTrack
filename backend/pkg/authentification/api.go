package authentification

import (
	"net/http"
	"sync"

	"github.com/DominikKuenkele/TimeTrack/libraries/logger"
	"github.com/DominikKuenkele/TimeTrack/libraries/user"
)

const (
	uidHeader      = "X-authentik-uid"
	usernameHeader = "X-authentik-username"
)

type API interface {
	Authenticate(next http.HandlerFunc) http.HandlerFunc
}

type apiImpl struct {
	logger  logger.Logger
	handler Handler
	devUser string
	adopted sync.Map
}

var _ API = &apiImpl{}

func NewAPI(logger logger.Logger, handler Handler, devUser string) API {
	return &apiImpl{
		logger:  logger,
		handler: handler,
		devUser: devUser,
	}
}

func (a *apiImpl) Authenticate(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		uid, username, ok := identify(r.Header, a.devUser)
		if !ok {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		if username != "" && username != uid {
			if _, done := a.adopted.Load(uid); !done {
				if err := a.handler.AdoptUsernameData(uid, username); err != nil {
					a.logger.Error("Couldn't adopt the data of %s: %+v", username, err)
					http.Error(w, "Internal Server Error", http.StatusInternalServerError)
					return
				}
				a.adopted.Store(uid, struct{}{})
			}
		}

		next.ServeHTTP(w, r.WithContext(user.ToContext(r.Context(), uid)))
	}
}

func identify(header http.Header, devUser string) (uid, username string, ok bool) {
	if uid := header.Get(uidHeader); uid != "" {
		return uid, header.Get(usernameHeader), true
	}
	if devUser != "" {
		return devUser, "", true
	}
	return "", "", false
}
