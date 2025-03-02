package projects

import (
	"errors"
	"fmt"
	"time"

	"github.com/DominikKuenkele/TimeTrack/libraries/database"
	"github.com/DominikKuenkele/TimeTrack/libraries/logger"
)

type Repository interface {
	AddProject(name string) error
	GetProject(name string) (*Project, error)
	DeleteProject(name string) error
	StartTracking(projectID int32) error
}

type repositoryImpl struct {
	logger   logger.Logger
	database database.Database
}

var _ Repository = &repositoryImpl{}

func NewRepository(logger logger.Logger, database database.Database) (Repository, error) {
	if database == nil {
		return nil, errors.New("Database must not be nil")
	}

	return &repositoryImpl{
		logger:   logger,
		database: database,
	}, nil
}

const (
	tableProjects      = "projects"
	columnProjectsID   = "id"
	columnProjectsName = "name"

	tableTracking           = "tracking"
	columnTrackingId        = "id"
	columnTrackingProject   = "project_id"
	columnTrackingStartTime = "start_time"
	columnTrackingEndTime   = "end_time"
)

func (r *repositoryImpl) AddProject(name string) error {
	_, err := r.database.Exec("INSERT INTO "+tableProjects+" ("+columnProjectsName+") VALUES ($1);", name)
	if err != nil {
		r.logger.Error("Couldn't add project: %+v", err)
		switch {
		case errors.As(err, &database.DuplicateError{}):
			return fmt.Errorf("Project '%s' already exists", name)
		default:
			return fmt.Errorf("Database error")
		}
	}

	return nil
}

func (r *repositoryImpl) GetProject(name string) (*Project, error) {
	var project = &Project{}
	if err := r.database.QueryRow(
		"SELECT "+columnProjectsID+", "+columnProjectsName+" FROM "+tableProjects+" WHERE "+columnProjectsName+"=$1;",
		[]any{name},
		&project.ID, &project.Name,
	); err != nil {
		r.logger.Error("Couldn't get project: %+v", err)
		switch {
		case errors.As(err, &database.NoRowsError{}):
			return &Project{}, fmt.Errorf("Project '%s' not found", name)
		default:
			return &Project{}, fmt.Errorf("Database error")
		}

	}

	return project, nil
}

func (r *repositoryImpl) DeleteProject(name string) error {
	res, err := r.database.Exec("DELETE FROM "+tableProjects+" WHERE "+columnProjectsName+"=$1;", name)
	if err != nil {
		r.logger.Error("Couldn't delete project: %+v", err)

		return fmt.Errorf("Database error")
	}

	if rows, _ := res.RowsAffected(); rows != 1 {
		r.logger.Error("Couldn't find and delete project: %s", name)

		return &database.NoRowsError{
			Message: fmt.Sprintf("Project '%s' not found", name),
		}
	}

	return nil
}

func (r *repositoryImpl) StartTracking(projectID int32) error {
	if _, err := r.database.Exec(
		"INSERT INTO "+tableTracking+"("+columnTrackingProject+", "+columnTrackingStartTime+") VALUES($1, $2);",
		projectID, time.Now(),
	); err != nil {
		r.logger.Error("Couldn't start timer for project '%s': %+v", projectID, err)

		return fmt.Errorf("Database error")
	}

	return nil
}
