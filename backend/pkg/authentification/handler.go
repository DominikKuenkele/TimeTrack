package authentification

import (
	"crypto/rand"
	"encoding/base64"
	"errors"
	"time"

	"github.com/DominikKuenkele/TimeTrack/libraries/logger"
	"golang.org/x/crypto/bcrypt"
)

const sessionLength = 24 * time.Hour

type Handler interface {
	CreateUser(username, password string) (string, time.Time, error)
	Login(username, password string) (string, time.Time, error)
	Logout(sessionID string) error
	ValidateSession(sessionID string) (string, error)
}

type handlerImpl struct {
	logger            logger.Logger
	sessionRepository SessionRepository
	userRepository    UserRepository
}

var _ Handler = &handlerImpl{}

func NewHandler(l logger.Logger, sessionRepository SessionRepository, userRepository UserRepository) Handler {
	return &handlerImpl{
		logger:            l,
		sessionRepository: sessionRepository,
		userRepository:    userRepository,
	}
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
