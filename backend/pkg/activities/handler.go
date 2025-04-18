package activities

import (
	"context"
	"errors"
	"time"

	"github.com/DominikKuenkele/TimeTrack/libraries/logger"
	"github.com/DominikKuenkele/TimeTrack/libraries/user"
	"github.com/DominikKuenkele/TimeTrack/projects"
)

type Handler interface {
	GetActivities(ctx context.Context, startDay, endDay time.Time) (projects.Activities, error)
	ChangeActivity(ctx context.Context, activity projects.Activity) error
}

type handlerImpl struct {
	logger     logger.Logger
	repository projects.Repository
}

var _ Handler = &handlerImpl{}

func NewHandler(l logger.Logger, repository projects.Repository) Handler {
	return &handlerImpl{
		logger:     l,
		repository: repository,
	}
}

func (h *handlerImpl) GetActivities(ctx context.Context, startDay, endDay time.Time) (projects.Activities, error) {
	if startDay.IsZero() || endDay.IsZero() {
		return nil, errors.New("start and end day must be set")
	}

	activities := projects.Activities{}
	for day := startDay; day.Before(endDay) || day.Equal(endDay); day = day.AddDate(0, 0, 1) {
		dailyActivities, err := h.repository.GetActivities(user.FromContext(ctx), day)
		if err != nil {
			return nil, err
		}

		if dailyActivities != nil {
			activities = append(activities, dailyActivities...)
		}
	}

	return activities, nil
}

func (h *handlerImpl) ChangeActivity(ctx context.Context, activity projects.Activity) error {
	return h.repository.ChangeActivity(user.FromContext(ctx), activity)
}
