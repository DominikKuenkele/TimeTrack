package authentification

import (
	"net/http"
	"strings"

	"github.com/DominikKuenkele/TimeTrack/libraries/logger"
	"github.com/DominikKuenkele/TimeTrack/libraries/user"
)

const Prefix = "/user"

type API interface {
	Authenticate(next http.HandlerFunc) http.HandlerFunc
}

type apiImpl struct {
	logger                  logger.Logger
	authentificationHandler Handler
}

var _ API = &apiImpl{}

func NewAPI(logger logger.Logger, authentificationHandler Handler) API {
	return &apiImpl{
		logger:                  logger,
		authentificationHandler: authentificationHandler,
	}
}

func (a *apiImpl) Authenticate(next http.HandlerFunc) http.HandlerFunc {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if token := extractBearerToken(r); token != "" {
			if userID, err := a.authentificationHandler.VerifyBearerToken(token); err == nil {
				ctx := user.ToContext(r.Context(), userID)
				next.ServeHTTP(w, r.WithContext(ctx))
				return
			}
		}

		http.Error(w, "Unauthorized", http.StatusUnauthorized)
	})
}

func extractBearerToken(r *http.Request) string {
	authHeader := r.Header.Get("Authorization")
	if authHeader == "" {
		return ""
	}

	parts := strings.Split(authHeader, " ")
	if len(parts) != 2 || parts[0] != "Bearer" {
		return ""
	}

	return parts[1]
}
