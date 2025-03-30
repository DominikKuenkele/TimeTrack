package activities

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/DominikKuenkele/TimeTrack/libraries/logger"
)

const Prefix = "/activities"

type API interface {
	HTTPHandler(w http.ResponseWriter, r *http.Request)
}

type apiImpl struct {
	logger          logger.Logger
	activityHandler Handler
}

var _ API = &apiImpl{}

func NewAPI(logger logger.Logger, activityHandler Handler) API {
	return &apiImpl{
		logger:          logger,
		activityHandler: activityHandler,
	}
}

type actionFunc func(w http.ResponseWriter, r *http.Request) error

func (a *apiImpl) HTTPHandler(w http.ResponseWriter, r *http.Request) {
	actionMap := map[string]actionFunc{
		"": a.handleNoAction,
	}

	w.Header().Set("Content-Type", "application/json")

	pathSegments := strings.Split(strings.Trim(r.URL.Path, "/"), "/")

	var (
		err    error
		action string
	)
	if len(pathSegments) > 1 {
		action, err = url.PathUnescape(pathSegments[2])
		if err != nil {
			a.sendInvalidInputResponse(w, fmt.Errorf("couldn't parse action '%s'", pathSegments[1]))
			return
		}
	}

	actionFunction, found := actionMap[action]
	if !found {
		a.sendInvalidInputResponse(w, fmt.Errorf("action '%s' not supported", action))
		return
	}

	err = actionFunction(w, r)
	if err != nil {
		a.sendInvalidInputResponse(w, err)
	}
}

func (a *apiImpl) sendInvalidInputResponse(w http.ResponseWriter, err error) {
	a.logger.Error(err.Error())

	w.WriteHeader(http.StatusBadRequest)

	jsonResponse, _ := json.Marshal(
		map[string]string{
			"error":   "Invalid Input",
			"message": err.Error(),
		})
	w.Write(jsonResponse)
}

func (a *apiImpl) handleNoAction(w http.ResponseWriter, r *http.Request) error {
	switch r.Method {
	case http.MethodGet:
		var (
			startDay, endDay time.Time
			err              error
		)
		if startDayParam := r.URL.Query().Get("startDay"); startDayParam != "" {
			startDay, err = time.Parse("2006-01-02", startDayParam)
			if err != nil {
				return fmt.Errorf("invalid startDay parameter: %s. Must be of format '2006-01-02'", startDayParam)
			}
		} else {
			return errors.New("startDay parameter must be set")
		}

		if endDayParam := r.URL.Query().Get("endDay"); endDayParam != "" {
			endDay, err = time.Parse("2006-01-02", endDayParam)
			if err != nil {
				return fmt.Errorf("invalid endDay parameter: %s. Must be of format '2006-01-02'", endDayParam)
			}
		} else {
			endDay = startDay
		}

		activities, err := a.activityHandler.GetActivities(r.Context(), startDay, endDay)
		if err != nil {
			return err
		}

		w.WriteHeader(http.StatusOK)
		jsonResponse, _ := json.Marshal(activities)
		w.Write(jsonResponse)
	default:
		w.WriteHeader(http.StatusMethodNotAllowed)
	}

	return nil
}
