package activities

import (
	"context"
	"errors"
	"time"

	"github.com/DominikKuenkele/TimeTrack/libraries/logger"
	"github.com/DominikKuenkele/TimeTrack/libraries/user"
	"github.com/DominikKuenkele/TimeTrack/projects"
)

const workHours = 8 * 60 * 60

type Handler interface {
	GetDailyActivities(ctx context.Context, day time.Time) (projects.DailyActivities, error)
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

func (h *handlerImpl) GetDailyActivities(ctx context.Context, day time.Time) (projects.DailyActivities, error) {
	if day.IsZero() {
		return projects.DailyActivities{}, errors.New("day must be set")
	}

	userID := user.FromContext(ctx)

	activites, err := h.repository.GetActivities(userID, day)
	if err != nil {
		return projects.DailyActivities{}, err
	}

	worktime, err := h.repository.GetWorktime(userID)
	if err != nil {
		return projects.DailyActivities{}, err
	}

	var overtime int64
	for _, day := range worktime {
		overtime += int64(day.Worktime-day.Breaktime) - workHours
	}

	res := projects.DailyActivities{
		Activities: activites,
		Overtime:   overtime,
	}
	res.CalculateBreaktime()
	res.CalculateWorktime()

	return res, nil
}

func (h *handlerImpl) ChangeActivity(ctx context.Context, activity projects.Activity) error {
	return h.repository.ChangeActivity(user.FromContext(ctx), activity)
}
