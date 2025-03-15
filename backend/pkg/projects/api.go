package projects

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"strconv"
	"strings"

	"github.com/DominikKuenkele/TimeTrack/libraries/logger"
)

const Prefix = "/projects"
const DefaultPage = 1
const DefaultPerPage = 2

type API interface {
	HTTPHandler(w http.ResponseWriter, r *http.Request)
}

type apiImpl struct {
	logger         logger.Logger
	projectHandler Handler
}

var _ API = &apiImpl{}

func NewAPI(logger logger.Logger, projectHandler Handler) API {
	return &apiImpl{
		logger:         logger,
		projectHandler: projectHandler,
	}
}

type actionFunc func(w http.ResponseWriter, r *http.Request, name string) error

func (a *apiImpl) HTTPHandler(w http.ResponseWriter, r *http.Request) {
	actionMap := map[string]actionFunc{
		"":      a.handleNoAction,
		"start": a.handleStartProjectAction,
		"stop":  a.handleStopProjectAction,
	}

	w.Header().Set("Content-Type", "application/json")

	pathSegments := strings.Split(strings.Trim(r.URL.Path, "/"), "/")

	var (
		err    error
		name   string
		action string
	)
	if len(pathSegments) > 1 {
		name, err = url.PathUnescape(pathSegments[1])
		if err != nil {
			a.sendInvalidInputResponse(w, fmt.Errorf("couldn't parse name '%s'", pathSegments[1]))
			return
		}
	}
	if len(pathSegments) > 2 {
		action, err = url.PathUnescape(pathSegments[2])
		if err != nil {
			a.sendInvalidInputResponse(w, fmt.Errorf("couldn't parse action '%s'", pathSegments[2]))
			return
		}
	}

	actionFunction, found := actionMap[action]
	if !found {
		a.sendInvalidInputResponse(w, fmt.Errorf("action '%s' not supported", action))
		return
	}

	err = actionFunction(w, r, name)
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

func (a *apiImpl) handleNoAction(w http.ResponseWriter, r *http.Request, name string) error {
	switch r.Method {
	case http.MethodGet:
		if name == "" {
			// Parse pagination parameters
			page := DefaultPage
			perPage := DefaultPerPage

			if pageParam := r.URL.Query().Get("page"); pageParam != "" {
				parsedPage, err := strconv.Atoi(pageParam)
				if err != nil || parsedPage < 1 {
					return fmt.Errorf("invalid page parameter: %s", pageParam)
				}
				page = parsedPage
			}

			if perPageParam := r.URL.Query().Get("per_page"); perPageParam != "" {
				parsedPerPage, err := strconv.Atoi(perPageParam)
				if err != nil || parsedPerPage < 1 {
					return fmt.Errorf("invalid per_page parameter: %s", perPageParam)
				}
				perPage = parsedPerPage
			}

			// Use the paginated handler
			paginatedProjects, err := a.projectHandler.GetAllPaginated(page, perPage)
			if err != nil {
				return err
			}

			w.WriteHeader(http.StatusOK)
			jsonResponse, _ := json.Marshal(paginatedProjects)
			w.Write(jsonResponse)
		} else {
			project, err := a.projectHandler.Get(name)
			if err != nil {
				return err
			}

			w.WriteHeader(http.StatusOK)
			jsonResponse, _ := json.Marshal(project)
			w.Write(jsonResponse)
		}
	case http.MethodPost:
		if err := a.projectHandler.Add(name); err != nil {
			return err
		}

		w.WriteHeader(http.StatusCreated)
	case http.MethodDelete:
		if err := a.projectHandler.Delete(name); err != nil {
			return err
		}

		w.WriteHeader(http.StatusOK)
	default:
		w.WriteHeader(http.StatusMethodNotAllowed)
	}

	return nil
}

func (a *apiImpl) handleStartProjectAction(w http.ResponseWriter, r *http.Request, name string) error {
	switch r.Method {
	case http.MethodPost:
		if err := a.projectHandler.StartProject(name); err != nil {
			return err
		}

		w.WriteHeader(http.StatusOK)
	default:
		w.WriteHeader(http.StatusMethodNotAllowed)
	}

	return nil
}

func (a *apiImpl) handleStopProjectAction(w http.ResponseWriter, r *http.Request, name string) error {
	switch r.Method {
	case http.MethodPost:
		if err := a.projectHandler.StopProject(name); err != nil {
			return err
		}

		w.WriteHeader(http.StatusOK)
	default:
		w.WriteHeader(http.StatusMethodNotAllowed)
	}

	return nil
}
