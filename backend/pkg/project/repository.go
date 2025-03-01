package project

import (
	"github.com/DominikKuenkele/TimeTrack/libraries/database"
	"github.com/DominikKuenkele/TimeTrack/libraries/logger"
)

type Repository interface {
	SaveProject()
	GetProject()
	DeleteProject()
}

type repositoryImpl struct {
	logger   logger.Logger
	database database.Database
}

var _ Repository = &repositoryImpl{}

func NewRepository(logger logger.Logger, database database.Database) Repository {
	return &repositoryImpl{
		logger:   logger,
		database: database,
	}
}

func (r *repositoryImpl) SaveProject() {
	r.logger.Info("Repository - save project")
}

func (r *repositoryImpl) GetProject() {
	r.logger.Info("Repository - get project")
}

func (r *repositoryImpl) DeleteProject() {
	r.logger.Info("Repository - delete project")
}
