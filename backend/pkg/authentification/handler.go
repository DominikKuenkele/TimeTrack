package authentification

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/DominikKuenkele/TimeTrack/libraries/logger"
	"github.com/coreos/go-oidc/v3/oidc"
	"golang.org/x/crypto/bcrypt"
)

const sessionLength = 24 * time.Hour

type Handler interface {
	CreateUser(username, password string) (string, time.Time, error)
	Login(username, password string) (string, time.Time, error)
	Logout(sessionID string) error
	ValidateSession(sessionID string) (string, error)
	ValidateOAuthToken(token string) (string, time.Time, error)
}

type handlerImpl struct {
	logger            logger.Logger
	sessionRepository SessionRepository
	userRepository    UserRepository
	oauthServerURL    string
	provider          *oidc.Provider
	verifier          *oidc.IDTokenVerifier
}

var _ Handler = &handlerImpl{}

func NewHandler(
	l logger.Logger,
	sessionRepository SessionRepository,
	userRepository UserRepository,
	oauthServerURL,
	oauthClientID string,
) (Handler, error) {
	ctx := context.Background()

	providerConfig := oidc.ProviderConfig{
		IssuerURL:   oauthServerURL + "/application/o/timetrack/",
		AuthURL:     oauthServerURL + "/application/o/authorize/",
		TokenURL:    oauthServerURL + "/application/o/token/",
		UserInfoURL: oauthServerURL + "/application/o/userinfo/",
		JWKSURL:     oauthServerURL + "/application/o/timetrack/jwks/",
	}
	provider := providerConfig.NewProvider(ctx)

	verifier := provider.Verifier(&oidc.Config{
		ClientID: oauthClientID,
	})

	return &handlerImpl{
		logger:            l,
		sessionRepository: sessionRepository,
		userRepository:    userRepository,
		oauthServerURL:    oauthServerURL,
		provider:          provider,
		verifier:          verifier,
	}, nil
}

func (h *handlerImpl) CreateUser(userID, password string) (string, time.Time, error) {
	if userID == "" {
		return "", time.Time{}, errors.New("username must not be empty")
	}

	if password == "" {
		return "", time.Time{}, errors.New("password must not be empty")
	}

	passwordHash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		h.logger.Error("Error hashing password: %+v", err)
		return "", time.Time{}, errors.New("couldn't save the password")
	}

	if err = h.userRepository.CreateUser(userID, string(passwordHash)); err != nil {
		// TODO user already exists?
		return "", time.Time{}, errors.New("couldn't create user")
	}

	return h.createSession(userID)
}

func (h *handlerImpl) Login(userID, password string) (string, time.Time, error) {
	if userID == "" {
		return "", time.Time{}, errors.New("username must not be empty")
	}

	storedHash, err := h.userRepository.GetPasswordHash(userID)
	if err != nil {
		return "", time.Time{}, errors.New("invalid user/password")
	}

	if err = bcrypt.CompareHashAndPassword([]byte(storedHash), []byte(password)); err != nil {
		return "", time.Time{}, errors.New("invalid user/password")
	}

	return h.createSession(userID)
}

func (h *handlerImpl) createSession(userID string) (string, time.Time, error) {
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		return "", time.Time{}, err
	}
	sessionID := base64.URLEncoding.EncodeToString(b)

	expiry := time.Now().Add(sessionLength)
	if err := h.sessionRepository.CreateSession(sessionID, userID, expiry); err != nil {
		return "", time.Time{}, err
	}

	return sessionID, expiry, nil
}

func (h *handlerImpl) Logout(sessionID string) error {
	return h.sessionRepository.DeleteSession(sessionID)
}

func (h *handlerImpl) ValidateSession(sessionID string) (string, error) {
	return h.sessionRepository.GetSessionUser(sessionID)
}

func (h *handlerImpl) ValidateOAuthToken(token string) (string, time.Time, error) {
	if token == "" {
		return "", time.Time{}, errors.New("token must not be empty")
	}

	idToken, err := h.verifier.Verify(context.Background(), token)
	if err != nil {
		return "", time.Time{}, fmt.Errorf("failed to verify token: %w", err)
	}

	var claims struct {
		Sub           string   `json:"sub"`
		Email         string   `json:"email"`
		EmailVerified bool     `json:"email_verified"`
		Name          string   `json:"name"`
		Groups        []string `json:"groups"`
		IssuedAt      int64    `json:"iat"`
		ExpiresAt     int64    `json:"exp"`
		Issuer        string   `json:"iss"`
		Audience      []string `json:"aud"`
	}
	if err := idToken.Claims(&claims); err != nil {
		return "", time.Time{}, fmt.Errorf("failed to parse token claims: %w", err)
	}

	if claims.Sub == "" {
		return "", time.Time{}, errors.New("invalid token: missing subject")
	}

	if claims.ExpiresAt < time.Now().Unix() {
		return "", time.Time{}, errors.New("token has expired")
	}

	if !strings.HasPrefix(claims.Issuer, h.oauthServerURL) {
		return "", time.Time{}, errors.New("invalid token issuer")
	}

	h.logger.Info("User authenticated via OAuth: %s (email: %s, name: %s)",
		claims.Sub, claims.Email, claims.Name)

	return h.createSession(claims.Sub)
}
