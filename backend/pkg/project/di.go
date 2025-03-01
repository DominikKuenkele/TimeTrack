package project

import (
	"github.com/DominikKuenkele/TimeTrack/libraries/database"
	"github.com/DominikKuenkele/TimeTrack/libraries/logger"
)

func BuildProject(logger logger.Logger, database database.Database) API {
	projectRepository := NewRepository(logger, database)
	projectHandler := NewHandler(logger, projectRepository)
	api := NewAPI(logger, projectHandler)

	return api
}
