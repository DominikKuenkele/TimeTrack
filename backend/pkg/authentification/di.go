package authentification

import (
	"github.com/DominikKuenkele/TimeTrack/libraries/database"
	"github.com/DominikKuenkele/TimeTrack/libraries/logger"
)

func BuildAuthenticator(logger logger.Logger, db database.Database, devUser string) API {
	return NewAPI(logger, NewHandler(db), devUser)
}
