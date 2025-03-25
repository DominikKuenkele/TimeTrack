package authentification

import (
	"errors"
	"fmt"
	"time"

	"github.com/DominikKuenkele/TimeTrack/libraries/database"
	"github.com/DominikKuenkele/TimeTrack/libraries/logger"
)

type SessionRepository interface {
	CreateSession(sessionID, userID string, expiresAt time.Time) error
	DeleteSession(sessionID string) error
	GetSessionUser(sessionID string) (string, error)
}

type sessionRepositoryImpl struct {
	logger   logger.Logger
	database database.Database
}

var _ SessionRepository = &sessionRepositoryImpl{}

func NewSessionRepository(logger logger.Logger, database database.Database) (SessionRepository, error) {
	if database == nil {
		return nil, errors.New("database must not be nil")
	}

	return &sessionRepositoryImpl{
		logger:   logger,
		database: database,
	}, nil
}

const (
	tableSessions           = "sessions"
	columnSessionsSessionID = "session_id"
	columnSessionsUserID    = "user_id"
	columnExpiresAt         = "expires_at"
	columnSessionsCreatedAt = "created_at"
	columnSessionsUpdatedAt = "updated_at"
)

func (r *sessionRepositoryImpl) CreateSession(sessionID, userID string, expiresAt time.Time) error {
	_, err := r.database.Exec(
		"INSERT"+
			" INTO "+tableSessions+
			" ("+columnSessionsSessionID+", "+columnSessionsUserID+", "+columnExpiresAt+")"+
			" VALUES ($1, $2, $3);",
		sessionID, userID, expiresAt)
	if err != nil {
		return r.logger.LogAndAbstractError("database error", "Couldn't create session: %+v", err)
	}

	// cleanup sessions around once a day to avoid cronjob
	r.CleanUpSessions()

	return nil
}

func (r *sessionRepositoryImpl) DeleteSession(sessionID string) error {
	if _, err := r.database.Exec(
		"DELETE"+
			" FROM "+tableSessions+
			" WHERE "+columnSessionsSessionID+" = $1;",
		sessionID,
	); err != nil {
		return r.logger.LogAndAbstractError("database error", "Couldn't delete session: %+v", err)
	}

	return nil
}

func (r *sessionRepositoryImpl) GetSessionUser(sessionID string) (string, error) {
	var userID string
	if err := r.database.QueryRow(
		"SELECT "+columnSessionsUserID+
			" FROM "+tableSessions+
			" WHERE "+columnSessionsSessionID+"=$1 AND "+columnExpiresAt+">NOW();",
		[]any{sessionID},
		&userID,
	); err != nil {
		switch {
		case errors.As(err, &database.NoRowsError{}):
			return "", fmt.Errorf("session '%s' not found", sessionID)
		default:
			return "", r.logger.LogAndAbstractError("database error", "Error scanning session: %+v", err)
		}
	}

	return userID, nil
}

func (r *sessionRepositoryImpl) CleanUpSessions() {
	if _, err := r.database.Exec(
		"DELETE" +
			" FROM " + tableSessions +
			" WHERE " + columnExpiresAt + "<NOW();",
	); err != nil {
		r.logger.Error("Error while cleaning up sessions: %+v", err)
	}
}
