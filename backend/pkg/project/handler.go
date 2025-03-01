package project

import (
	"net/http"

	"github.com/DominikKuenkele/TimeTrack/libraries/logger"
)

type Handler interface {
	ProjectHandler(w http.ResponseWriter, r *http.Request)

	Add(name string)
	Get(name string)
	Delete(name string)
}

type impl struct {
	logger logger.Logger
}

var _ Handler = &impl{}

func NewHandler(l logger.Logger) Handler {
	return &impl{
		logger: l,
	}
}

func (i *impl) Add(name string) {
	i.logger.Info("Add %s", name)
}

func (i *impl) Delete(name string) {
	i.logger.Info("Delete %s", name)
}

func (i *impl) Get(name string) {
	i.logger.Info("Get %s", name)
}
