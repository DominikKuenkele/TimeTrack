package projects

import (
	"context"
	"errors"
	"math"

	"github.com/DominikKuenkele/TimeTrack/libraries/logger"
	"github.com/DominikKuenkele/TimeTrack/libraries/user"
)

type Handler interface {
	Add(ctx context.Context, name string) error
	Get(ctx context.Context, name string) (*Project, error)
	GetAll(ctx context.Context) ([]*Project, error)
	GetAllLike(ctx context.Context, searchTerm string) ([]*Project, error)
	GetPaginatedLike(ctx context.Context, page, perPage int, searchTerm string) (*PaginatedProjects, error)
	Delete(ctx context.Context, name string) error
	StartProject(ctx context.Context, name string) error
	StopProject(ctx context.Context, name string) error
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

func (h *handlerImpl) Add(ctx context.Context, name string) error {
	if name == "" {
		return errors.New("name must not be empty")
	}

	return h.repository.AddProject(user.FromContext(ctx), name)
}

func (h *handlerImpl) Delete(ctx context.Context, name string) error {
	if name == "" {
		return errors.New("name must not be empty")
	}

	return h.repository.DeleteProject(user.FromContext(ctx), name)
}

func (h *handlerImpl) GetAll(ctx context.Context) ([]*Project, error) {
	return h.repository.GetProjectsLike(user.FromContext(ctx), "")
}

func (h *handlerImpl) GetAllLike(ctx context.Context, searchTerm string) ([]*Project, error) {
	return h.repository.GetProjectsLike(user.FromContext(ctx), searchTerm)
}

func (h *handlerImpl) GetPaginatedLike(ctx context.Context, page, perPage int, searchTerm string) (*PaginatedProjects, error) {
	allProjects, err := h.repository.GetProjectsLike(user.FromContext(ctx), searchTerm)
	if err != nil {
		return nil, err
	}

	result := &PaginatedProjects{
		Page:    page,
		PerPage: perPage,
		Total:   len(allProjects),
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
	result.TotalPages = max(1, int(math.Ceil(float64(len(remainingProjects))/float64(perPage))))

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

func (h *handlerImpl) Get(ctx context.Context, name string) (*Project, error) {
	if name == "" {
		return nil, errors.New("name must not be empty")
	}

	return h.repository.GetProject(user.FromContext(ctx), name)
}

func (h *handlerImpl) StartProject(ctx context.Context, name string) error {
	if name == "" {
		return errors.New("name must not be empty")
	}

	return h.repository.StartProject(user.FromContext(ctx), name)

}

func (h *handlerImpl) StopProject(ctx context.Context, name string) error {
	if name == "" {
		return errors.New("name must not be empty")
	}

	return h.repository.StopProject(user.FromContext(ctx), name)
}
