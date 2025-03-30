package activities

import (
	"fmt"

	"github.com/DominikKuenkele/TimeTrack/libraries/database"
	"github.com/DominikKuenkele/TimeTrack/libraries/logger"
	"github.com/DominikKuenkele/TimeTrack/projects"
)

func BuildActivity(logger logger.Logger, database database.Database) (API, error) {
	projectRepository, err := projects.NewRepository(logger, database)
	if err != nil {
		return nil, fmt.Errorf("errror building activity. %+v", err)
	}

	activityHandler := NewHandler(logger, projectRepository)
	api := NewAPI(logger, activityHandler)

	return api, nil
}
