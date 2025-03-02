package project

import (
	"encoding/json"
	"net/http"
	"strconv"

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
	queryParams := r.URL.Query()
	name := queryParams.Get("name")

	w.Header().Set("Content-Type", "application/json")
	var err error
	switch r.Method {
	case "GET":
		var project *Project
		project, err = a.projectHandler.Get(name)
		if err == nil {
			w.WriteHeader(http.StatusOK)

			jsonResponse, _ := json.Marshal(
				map[string]string{
					"id":   strconv.Itoa(int(project.ID)),
					"name": project.Name,
				})
			w.Write(jsonResponse)
		}
	case "POST":
		err = a.projectHandler.Add(name)
		if err == nil {
			w.WriteHeader(http.StatusCreated)
		}
	case "DELETE":
		err = a.projectHandler.Delete(name)
		if err == nil {
			w.WriteHeader(http.StatusOK)
		}
	}

	if err != nil {
		w.WriteHeader(http.StatusBadRequest)

		jsonResponse, _ := json.Marshal(
			map[string]string{
				"error":   "Invalid Input",
				"message": err.Error(),
			})
		w.Write(jsonResponse)
	}
}
