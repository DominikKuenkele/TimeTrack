package projects

import (
	"errors"

	"github.com/DominikKuenkele/TimeTrack/libraries/logger"
)

type Handler interface {
	Add(name string) error
	Get(name string) (*Project, error)
	GetAll() ([]*Project, error)
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
	return h.repository.GetAllProjects()
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
