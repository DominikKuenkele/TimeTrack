package projects

import (
	"errors"
	"math"

	"github.com/DominikKuenkele/TimeTrack/libraries/logger"
)

type Handler interface {
	Add(name string) error
	Get(name string) (*Project, error)
	GetAll() ([]*Project, error)
	GetAllLike(searchTerm string) ([]*Project, error)
	GetPaginatedLike(page, perPage int, searchTerm string) (*PaginatedProjects, error)
	Delete(name string) error
	StartProject(name string) error
	StopProject(name string) error
}

type handlerImpl struct {
	logger     logger.Logger
	repository Repository
}

var _ Handler = &handlerImpl{}

func NewHandler(l logger.Logger, repository Repository) Handler {
	return &handlerImpl{
		logger:     l,
		repository: repository,
	}
}

func (h *handlerImpl) Add(name string) error {
	if name == "" {
		return errors.New("name must not be empty")
	}

	return h.repository.AddProject(name)
}

func (h *handlerImpl) Delete(name string) error {
	if name == "" {
		return errors.New("name must not be empty")
	}

	return h.repository.DeleteProject(name)
}

func (h *handlerImpl) GetAll() ([]*Project, error) {
	return h.repository.GetProjectsLike("")
}

func (h *handlerImpl) GetAllLike(searchTerm string) ([]*Project, error) {
	return h.repository.GetProjectsLike(searchTerm)
}

func (h *handlerImpl) GetPaginatedLike(page, perPage int, searchTerm string) (*PaginatedProjects, error) {
	allProjects, err := h.repository.GetProjectsLike(searchTerm)
	if err != nil {
		return nil, err
	}

	result := &PaginatedProjects{
		Page:       page,
		PerPage:    perPage,
		Total:      len(allProjects),
		TotalPages: (len(allProjects) + perPage - 1) / perPage,
	}

	var activeProject *Project
	var remainingProjects []*Project

	for _, project := range allProjects {
		if project.StartedAt != nil {
			activeProject = project
		} else {
			remainingProjects = append(remainingProjects, project)
		}
	}

	result.ActiveProject = activeProject
	result.TotalPages = int(math.Ceil(float64(len(remainingProjects)) / float64(perPage)))

	start := (page - 1) * perPage
	end := start + perPage

	if start > len(remainingProjects) {
		start = len(remainingProjects)
	}
	if end > len(remainingProjects) {
		end = len(remainingProjects)
	}

	if start < len(remainingProjects) {
		result.Projects = remainingProjects[start:end]
	} else {
		result.Projects = []*Project{}
	}

	return result, nil
}

func (h *handlerImpl) Get(name string) (*Project, error) {
	if name == "" {
		return nil, errors.New("name must not be empty")
	}

	return h.repository.GetProject(name)
}

func (h *handlerImpl) StartProject(name string) error {
	if name == "" {
		return errors.New("name must not be empty")
	}

	return h.repository.StartProject(name)

}

func (h *handlerImpl) StopProject(name string) error {
	if name == "" {
		return errors.New("name must not be empty")
	}

	return h.repository.StopProject(name)
}
