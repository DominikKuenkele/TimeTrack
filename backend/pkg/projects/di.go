package projects

import (
	"fmt"

	"github.com/DominikKuenkele/TimeTrack/libraries/database"
	"github.com/DominikKuenkele/TimeTrack/libraries/logger"
)

func BuildProject(logger logger.Logger, database database.Database) (API, error) {
	projectRepository, err := NewRepository(logger, database)
	if err != nil {
		return nil, fmt.Errorf("errror building project. %+v", err)
	}

	projectHandler := NewHandler(logger, projectRepository)
	api := NewAPI(logger, projectHandler)

	return api, nil
}
