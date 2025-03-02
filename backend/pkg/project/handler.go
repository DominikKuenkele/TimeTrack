package project

import (
	"errors"

	"github.com/DominikKuenkele/TimeTrack/libraries/logger"
)

type Handler interface {
	Add(name string) error
	Get(name string) (*Project, error)
	Delete(name string) error
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
		return errors.New("Name must not be empty")
	}

	return h.repository.AddProject(name)
}

func (h *handlerImpl) Delete(name string) error {
	if name == "" {
		return errors.New("Name must not be empty")
	}

	return h.repository.DeleteProject(name)
}

func (h *handlerImpl) Get(name string) (*Project, error) {
	if name == "" {
		return &Project{}, errors.New("Name must not be empty")
	}

	return h.repository.GetProject(name)
}
