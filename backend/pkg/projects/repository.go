package projects

import (
	"database/sql"
	"errors"
	"fmt"
	"time"

	"github.com/DominikKuenkele/TimeTrack/libraries/database"
	"github.com/DominikKuenkele/TimeTrack/libraries/logger"
)

type Repository interface {
	AddProject(name string) error
	GetProject(name string) (*Project, error)
	GetRunningProject() (*Project, error)
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
	columnProjectsStartedAt = "started_at"
	columnProjectsRuntime   = "runtime"
	columnProjectsCreatedAt = "created_at"
	columnProjectsUpdatedAt = "updated_at"
)

func (r *repositoryImpl) AddProject(name string) error {
	_, err := r.database.Exec("INSERT INTO "+tableProjects+" ("+columnProjectsName+") VALUES ($1);", name)
	if err != nil {
		switch {
		case errors.As(err, &database.DuplicateError{}):
			return fmt.Errorf("project '%s' already exists", name)
		default:
			return r.logAndAbstractError("Couldn't add project: %+v", err)
		}
	}

	return nil
}

func (r *repositoryImpl) GetAllProjects() ([]*Project, error) {
	res, err := r.database.Query(
		"SELECT " + columnProjectsID + ", " + columnProjectsName + ", " + columnProjectsStartedAt + ", " + columnProjectsRuntime + ", " + columnProjectsCreatedAt + ", " + columnProjectsUpdatedAt +
			" FROM " + tableProjects +
			" ORDER BY " + columnProjectsStartedAt + ", " + columnProjectsUpdatedAt + " DESC;",
	)
	if err != nil {
		return nil, r.logAndAbstractError("Error getting all projects: %+v", err)
	}

	projects := []*Project{}
	for res.Next() {
		project := &Project{}
		if err := res.Scan(&project.ID, &project.Name, &project.StartedAt, &project.RuntimeInSeconds, &project.CreatedAt, &project.UpdatedAt); err != nil {
			return nil, r.logAndAbstractError("Error scanning project: %+v", err)
		}
		projects = append(projects, project)
	}

	for _, project := range projects {
		if project.StartedAt != nil {
			*project.StartedAt = project.StartedAt.Local()
		}
		if project.CreatedAt != nil {
			*project.CreatedAt = project.CreatedAt.Local()
		}
		if project.UpdatedAt != nil {
			*project.UpdatedAt = project.UpdatedAt.Local()
		}
	}

	return projects, nil
}

func (r *repositoryImpl) GetProject(name string) (*Project, error) {
	var project = &Project{}
	if err := r.database.QueryRow(
		"SELECT "+columnProjectsID+", "+columnProjectsName+", "+columnProjectsStartedAt+", "+columnProjectsRuntime+", "+columnProjectsCreatedAt+", "+columnProjectsUpdatedAt+
			" FROM "+tableProjects+
			" WHERE "+tableProjects+"."+columnProjectsName+"=$1;",
		[]any{name},
		&project.ID, &project.Name, &project.StartedAt, &project.RuntimeInSeconds, &project.CreatedAt, &project.UpdatedAt,
	); err != nil {
		switch {
		case errors.As(err, &database.NoRowsError{}):
			return nil, fmt.Errorf("project '%s' not found", name)
		default:
			return nil, r.logAndAbstractError("Error scanning project: %+v", err)
		}
	}

	if project.StartedAt != nil {
		*project.StartedAt = project.StartedAt.Local()
	}
	if project.CreatedAt != nil {
		*project.CreatedAt = project.CreatedAt.Local()
	}
	if project.UpdatedAt != nil {
		*project.UpdatedAt = project.UpdatedAt.Local()
	}

	return project, nil
}

func (r *repositoryImpl) GetRunningProject() (*Project, error) {
	var project = &Project{}
	if err := r.database.QueryRow(
		"SELECT "+columnProjectsID+", "+columnProjectsName+", "+columnProjectsStartedAt+", "+columnProjectsRuntime+", "+columnProjectsCreatedAt+", "+columnProjectsUpdatedAt+
			" FROM "+tableProjects+
			" WHERE "+tableProjects+"."+columnProjectsStartedAt+" IS NOT NULL"+
			" LIMIT 1;",
		[]any{},
		&project.ID, &project.Name, &project.StartedAt, &project.RuntimeInSeconds, &project.CreatedAt, &project.UpdatedAt,
	); err != nil {
		switch {
		case errors.As(err, &database.NoRowsError{}):
			return nil, nil
		default:
			return nil, r.logAndAbstractError("Error scanning project: %+v", err)
		}
	}

	if project.StartedAt != nil {
		*project.StartedAt = project.StartedAt.Local()
	}
	if project.CreatedAt != nil {
		*project.CreatedAt = project.CreatedAt.Local()
	}
	if project.UpdatedAt != nil {
		*project.UpdatedAt = project.UpdatedAt.Local()
	}

	return project, nil
}

func (r *repositoryImpl) DeleteProject(name string) error {
	res, err := r.database.Exec("DELETE FROM "+tableProjects+" WHERE "+columnProjectsName+"=$1;", name)
	if err != nil {
		return r.logAndAbstractError("Couldn't delete project: %+v", err)
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

	if project.StartedAt != nil {
		return fmt.Errorf("project already started")
	}

	runningProject, err := r.GetRunningProject()
	if err != nil {
		return err
	}

	tx, err := r.database.Begin()
	if err != nil {
		return r.logAndAbstractError("Couldn't create transaction: %+v", err)
	}
	defer func() {
		if tx != nil {
			r.logger.Info("Rolling back transaction while starting project")
			if err := tx.Rollback(); err != nil {
				r.logger.Error("Failed to rollback transaction: %+v", err)
			}
		}
	}()

	if _, err := r.database.ExecWithTx(
		tx,
		"UPDATE "+tableProjects+
			" SET "+columnProjectsStartedAt+"=NOW()"+
			" WHERE "+columnProjectsName+"=$1;",
		name,
	); err != nil {
		return r.logAndAbstractError("Couldn't start project '%s': %+v", name, err)
	}

	if runningProject != nil {
		err = r.stopProjectWithTx(tx, runningProject.Name)
		if err != nil {
			return err
		}
	}

	tx.Commit()
	tx = nil

	return nil
}

func (r *repositoryImpl) StopProject(name string) error {
	return r.stopProjectWithTx(nil, name)
}

func (r *repositoryImpl) stopProjectWithTx(tx *sql.Tx, name string) error {
	project, err := r.GetProject(name)
	if err != nil {
		return r.logAndAbstractError("Failed to fetch project '%s': %+v", name, err)
	}

	if project.StartedAt == nil {
		return fmt.Errorf("project not running")
	}

	runtime := project.RuntimeInSeconds + uint64(time.Since(*project.StartedAt).Seconds())
	query := "UPDATE " + tableProjects +
		" SET " + columnProjectsRuntime + "=$1, " + columnProjectsStartedAt + "=NULL" +
		" WHERE " + columnProjectsName + "=$2;"
	args := []any{runtime, name}

	if tx == nil {
		_, err = r.database.Exec(query, args...)
	} else {
		_, err = r.database.ExecWithTx(tx, query, args...)
	}
	if err != nil {
		return r.logAndAbstractError("Couldn't stop project '%s': %+v", name, err)
	}

	return nil
}

func (r *repositoryImpl) logAndAbstractError(message string, args ...any) error {
	r.logger.Error(message, args...)

	return fmt.Errorf("database error")
}
