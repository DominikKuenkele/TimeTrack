package project

import (
	"github.com/DominikKuenkele/TimeTrack/libraries/logger"
)

type Handler interface {
	Add(name string)
	Get(name string)
	Delete(name string)
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

func (h *handlerImpl) Add(name string) {
	h.logger.Info("Add %s", name)
}

func (h *handlerImpl) Delete(name string) {
	h.logger.Info("Delete %s", name)
}

func (h *handlerImpl) Get(name string) {
	h.logger.Info("Get %s", name)
}
