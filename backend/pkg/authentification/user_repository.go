package authentification

import (
	"errors"
	"fmt"

	"github.com/DominikKuenkele/TimeTrack/libraries/database"
	"github.com/DominikKuenkele/TimeTrack/libraries/logger"
)

type UserRepository interface {
	CreateUser(userID, passwordHash string) error
	GetPasswordHash(userID string) (string, error)
}

type userRepositoryImpl struct {
	logger   logger.Logger
	database database.Database
}

var _ UserRepository = &userRepositoryImpl{}

func NewUserRepository(logger logger.Logger, database database.Database) (UserRepository, error) {
	if database == nil {
		return nil, errors.New("database must not be nil")
	}

	return &userRepositoryImpl{
		logger:   logger,
		database: database,
	}, nil
}

const (
	tableUsers           = "users"
	columnUserID         = "user_id"
	columnHashedPassword = "hashed_password"
	columnCreatedAt      = "created_at"
	columnUpdatedAt      = "updated_at"
)

func (u *userRepositoryImpl) CreateUser(userID, hashedPassword string) error {
	_, err := u.database.Exec(
		"INSERT"+
			" INTO "+tableUsers+
			" ("+columnUserID+", "+columnHashedPassword+")"+
			" VALUES ($1, $2);",
		userID, hashedPassword)
	if err != nil {
		return u.logger.LogAndAbstractError("database error", "Couldn't create user: %+v", err)
	}

	return nil
}

func (u *userRepositoryImpl) GetPasswordHash(userID string) (string, error) {
	var passwordHash string
	if err := u.database.QueryRow(
		"SELECT "+columnHashedPassword+
			" FROM "+tableUsers+
			" WHERE "+columnUserID+"=$1;",
		[]any{userID},
		&passwordHash,
	); err != nil {
		switch {
		case errors.As(err, &database.NoRowsError{}):
			return "", fmt.Errorf("user '%s' not found", userID)
		default:
			return "", u.logger.LogAndAbstractError("database error", "Error scanning user: %+v", err)
		}
	}

	return passwordHash, nil
}
