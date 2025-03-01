package project

import (
	"net/http"

	"github.com/DominikKuenkele/TimeTrack/libraries/logger"
)

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

func (a *apiImpl) HTTPHandler(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case "GET":
		a.projectHandler.Get("test")
	case "POST":
		a.projectHandler.Add("test")
	case "DELETE":
		a.projectHandler.Delete("test")
	}
}
