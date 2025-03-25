package authentification

import (
	"fmt"

	"github.com/DominikKuenkele/TimeTrack/libraries/database"
	"github.com/DominikKuenkele/TimeTrack/libraries/logger"
)

func BuildAuthenticator(logger logger.Logger, database database.Database) (API, error) {
	sessionRepository, err := NewSessionRepository(logger, database)
	if err != nil {
		return nil, fmt.Errorf("error building authenticator. %+v", err)
	}

	userRepository, err := NewUserRepository(logger, database)
	if err != nil {
		return nil, fmt.Errorf("error building authenticator. %+v", err)
	}

	authenticatorHandler := NewHandler(logger, sessionRepository, userRepository)
	api := NewAPI(logger, authenticatorHandler)

	return api, nil
}
