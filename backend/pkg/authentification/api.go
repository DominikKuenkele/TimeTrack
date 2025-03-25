package authentification

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/DominikKuenkele/TimeTrack/libraries/logger"
	"github.com/DominikKuenkele/TimeTrack/libraries/user"
)

const Prefix = "/user"

const sessionCookieKey = "session"

type API interface {
	HTTPHandler(w http.ResponseWriter, r *http.Request)
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

type actionFunc func(w http.ResponseWriter, r *http.Request) error

func (a *apiImpl) HTTPHandler(w http.ResponseWriter, r *http.Request) {
	actionMap := map[string]actionFunc{
		"login":    a.handleLoginAction,
		"logout":   a.handleLogoutAction,
		"create":   a.handleCreateAction,
		"validate": a.handleValidateAction,
	}

	w.Header().Set("Content-Type", "application/json")

	pathSegments := strings.Split(strings.Trim(r.URL.Path, "/"), "/")

	var (
		err    error
		action string
	)
	if len(pathSegments) > 1 {
		action, err = url.PathUnescape(pathSegments[1])
		if err != nil {
			a.sendInvalidInputResponse(w, fmt.Errorf("couldn't parse action '%s'", pathSegments[1]))
			return
		}
	}

	actionFunction, found := actionMap[action]
	if !found {
		a.sendInvalidInputResponse(w, fmt.Errorf("action '%s' not supported", action))
		return
	}

	err = actionFunction(w, r)
	if err != nil {
		a.sendInvalidInputResponse(w, err)
	}
}

func (a *apiImpl) sendInvalidInputResponse(w http.ResponseWriter, err error) {
	a.logger.Error(err.Error())

	w.WriteHeader(http.StatusBadRequest)

	jsonResponse, _ := json.Marshal(
		map[string]string{
			"error":   "Invalid Input",
			"message": err.Error(),
		})
	w.Write(jsonResponse)
}

func (a *apiImpl) handleLoginAction(w http.ResponseWriter, r *http.Request) error {
	switch r.Method {
	case http.MethodPost:
		type loginForm struct {
			Username string `json:"username"`
			Password string `json:"password"`
		}

		var loginData loginForm
		if err := json.NewDecoder(r.Body).Decode(&loginData); err != nil {
			return errors.New("error parsing parameters")
		}

		if loginData.Username == "" {
			return errors.New("username must be present")
		}

		if loginData.Password == "" {
			return errors.New("password must be present")
		}

		sessionID, expiry, err := a.authentificationHandler.Login(loginData.Username, loginData.Password)
		if err != nil {
			return err
		}

		setSessionCookie(w, sessionID, expiry)
		w.WriteHeader(http.StatusOK)
	default:
		w.WriteHeader(http.StatusMethodNotAllowed)
	}

	return nil
}

func (a *apiImpl) handleLogoutAction(w http.ResponseWriter, r *http.Request) error {
	switch r.Method {
	case http.MethodPost:
		sessionCookie, err := r.Cookie(sessionCookieKey)
		if err != nil || sessionCookie == nil {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return nil
		}

		if err := a.authentificationHandler.Logout(sessionCookie.Value); err != nil {
			return err
		}

		setSessionCookie(w, "", time.Unix(0, 0))
		w.WriteHeader(http.StatusOK)
	default:
		w.WriteHeader(http.StatusMethodNotAllowed)
	}

	return nil
}

func (a *apiImpl) handleCreateAction(w http.ResponseWriter, r *http.Request) error {
	switch r.Method {
	case http.MethodPost:
		type createForm struct {
			Username string `json:"username"`
			Password string `json:"password"`
		}

		var createData createForm
		if err := json.NewDecoder(r.Body).Decode(&createData); err != nil {
			return errors.New("error parsing parameters")
		}

		if createData.Username == "" {
			return errors.New("username must be present")
		}

		if createData.Password == "" {
			return errors.New("password must be present")
		}

		sessionID, expiry, err := a.authentificationHandler.CreateUser(createData.Username, createData.Password)
		if err != nil {
			return err
		}

		setSessionCookie(w, sessionID, expiry)
		w.WriteHeader(http.StatusOK)
	default:
		w.WriteHeader(http.StatusMethodNotAllowed)
	}

	return nil
}

func (a *apiImpl) handleValidateAction(w http.ResponseWriter, r *http.Request) error {
	switch r.Method {
	case http.MethodGet:
		var sessionValid bool
		if sessionCookie, _ := r.Cookie(sessionCookieKey); sessionCookie != nil {
			if _, err := a.authentificationHandler.ValidateSession(sessionCookie.Value); err == nil {
				sessionValid = true
			}
		}

		data, _ := json.Marshal(sessionValid)

		w.WriteHeader(http.StatusOK)
		w.Write(data)
	default:
		w.WriteHeader(http.StatusMethodNotAllowed)
	}

	return nil
}

func (a *apiImpl) Authenticate(next http.HandlerFunc) http.HandlerFunc {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		sessionCookie, err := r.Cookie(sessionCookieKey)
		if err != nil || sessionCookie == nil {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		userID, err := a.authentificationHandler.ValidateSession(sessionCookie.Value)
		if err != nil {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		ctx := user.ToContext(r.Context(), userID)

		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func setSessionCookie(w http.ResponseWriter, sessionID string, expiry time.Time) {
	http.SetCookie(w, &http.Cookie{
		Name:     sessionCookieKey,
		Value:    sessionID,
		Path:     "/",
		Expires:  expiry,
		HttpOnly: true,
		Secure:   true,
		SameSite: http.SameSiteStrictMode,
	})
}
