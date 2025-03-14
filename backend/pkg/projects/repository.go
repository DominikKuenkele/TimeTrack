package projects

import (
	"errors"
	"fmt"
	"time"

	"github.com/DominikKuenkele/TimeTrack/libraries/database"
	"github.com/DominikKuenkele/TimeTrack/libraries/logger"
	"github.com/DominikKuenkele/TimeTrack/projects/status"
)

type Repository interface {
	AddProject(name string) error
	GetProject(name string) (*Project, error)
	GetAllProjects() ([]*Project, error)
	DeleteProject(name string) error
	StartProject(name string) error
	StopProject(name string) error
}

type repositoryImpl struct {
	logger   logger.Logger
	database database.Database
}

var _ Repository = &repositoryImpl{}

func NewRepository(logger logger.Logger, database database.Database) (Repository, error) {
	if database == nil {
		return nil, errors.New("database must not be nil")
	}

	return &repositoryImpl{
		logger:   logger,
		database: database,
	}, nil
}

const (
	tableProjects           = "projects"
	columnProjectsID        = "id"
	columnProjectsName      = "name"
	columnProjectsStatus    = "status"
	columnProjectsStartedAt = "started_at"
	columnProjectsRuntime   = "runtime"
)

func (r *repositoryImpl) AddProject(name string) error {
	_, err := r.database.Exec("INSERT INTO "+tableProjects+" ("+columnProjectsName+") VALUES ($1);", name)
	if err != nil {
		r.logger.Error("Couldn't add project: %+v", err)
		switch {
		case errors.As(err, &database.DuplicateError{}):
			return fmt.Errorf("project '%s' already exists", name)
		default:
			return fmt.Errorf("database error")
		}
	}

	return nil
}

func (r *repositoryImpl) GetAllProjects() ([]*Project, error) {
	res, err := r.database.Query(
		"SELECT " + columnProjectsID + ", " + columnProjectsName + ", " + columnProjectsStatus +
			", " + columnProjectsStartedAt + "::timestamptz AT TIME ZONE 'UTC', " + columnProjectsRuntime +
			" FROM " + tableProjects + ";",
	)
	if err != nil {
		return nil, fmt.Errorf("database error")
	}

	projects := []*Project{}
	for res.Next() {
		project := &Project{}
		if err := res.Scan(&project.ID, &project.Name, &project.Status, &project.StartedAt, &project.RuntimeInMinutes); err != nil {
			r.logger.Error("Error scanning project: %+v", err)
			return nil, fmt.Errorf("database error")
		}
		projects = append(projects, project)
	}

	return projects, nil
}

func (r *repositoryImpl) GetProject(name string) (*Project, error) {
	var project = &Project{}
	if err := r.database.QueryRow(
		"SELECT "+columnProjectsID+", "+columnProjectsName+", "+columnProjectsStatus+
			", "+columnProjectsStartedAt+", "+columnProjectsRuntime+
			" FROM "+tableProjects+
			" WHERE "+tableProjects+"."+columnProjectsName+"=$1;",
		[]any{name},
		&project.ID, &project.Name, &project.Status, &project.StartedAt, &project.RuntimeInMinutes,
	); err != nil {
		r.logger.Error("Error scanning project: %+v", err)
		switch {
		case errors.As(err, &database.NoRowsError{}):
			return nil, fmt.Errorf("project '%s' not found", name)
		default:
			return nil, fmt.Errorf("database error")
		}
	}

	if project.StartedAt != nil {
		*project.StartedAt = project.StartedAt.Local()
	}

	return project, nil
}

func (r *repositoryImpl) DeleteProject(name string) error {
	res, err := r.database.Exec("DELETE FROM "+tableProjects+" WHERE "+columnProjectsName+"=$1;", name)
	if err != nil {
		r.logger.Error("Couldn't delete project: %+v", err)

		return fmt.Errorf("database error")
	}

	if rows, _ := res.RowsAffected(); rows != 1 {
		r.logger.Error("Couldn't find and delete project: %s", name)

		return &database.NoRowsError{
			Message: fmt.Sprintf("project '%s' not found", name),
		}
	}

	return nil
}

func (r *repositoryImpl) StartProject(name string) error {
	project, err := r.GetProject(name)
	if err != nil {
		return err
	}

	if project.Status == status.Started {
		return fmt.Errorf("project already started")
	}

	if _, err := r.database.Exec(
		"UPDATE "+tableProjects+
			" SET "+columnProjectsStatus+"=$1, "+columnProjectsStartedAt+"=NOW()"+
			" WHERE "+columnProjectsName+"=$2;",
		status.Started, name,
	); err != nil {
		r.logger.Error("Couldn't start project '%s': %+v", name, err)
		return fmt.Errorf("database error")
	}

	return nil
}

func (r *repositoryImpl) StopProject(name string) error {
	project, err := r.GetProject(name)
	if err != nil {
		return err
	}

	if project.Status != status.Started || project.StartedAt == nil {
		return fmt.Errorf("project not running")
	}

	runtime := project.RuntimeInMinutes + uint64(time.Now().Sub(*project.StartedAt).Minutes())
	if _, err := r.database.Exec(
		"UPDATE "+tableProjects+
			" SET "+columnProjectsStatus+"=$1, "+columnProjectsRuntime+"=$2"+
			" WHERE "+columnProjectsName+"=$3;",
		status.Stopped, runtime, name,
	); err != nil {
		r.logger.Error("Couldn't stop project '%s': %+v", name, err)

		return fmt.Errorf("database error")
	}

	return nil
}
