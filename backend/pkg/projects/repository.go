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
	AddProject(userID, name string) error
	GetProject(userID, name string) (*Project, error)
	GetRunningProject(userID string) (*Project, error)
	GetProjectsLike(userID, searchTerm string) ([]*Project, error)
	DeleteProject(userID, name string) error
	StartProject(userID, name string) error
	StopProject(userID, name string) error
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
	columnProjectsUserID    = "user_id"
	columnProjectsName      = "name"
	columnProjectsStartedAt = "started_at"
	columnProjectsRuntime   = "runtime"
	columnProjectsCreatedAt = "created_at"
	columnProjectsUpdatedAt = "updated_at"
)

func (r *repositoryImpl) AddProject(userID, name string) error {
	_, err := r.database.Exec(
		"INSERT"+
			" INTO "+tableProjects+
			" ("+columnProjectsUserID+", "+columnProjectsName+")"+
			" VALUES ($1, $2);",
		userID, name)
	if err != nil {
		switch {
		case errors.As(err, &database.DuplicateError{}):
			return fmt.Errorf("project '%s' already exists", name)
		default:
			return r.logger.LogAndAbstractError("database error", "Couldn't add project: %+v", err)
		}
	}

	return nil
}

func (r *repositoryImpl) GetProjectsLike(userID, searchTerm string) ([]*Project, error) {
	searchTerm = "%" + searchTerm + "%"

	res, err := r.database.Query(
		"SELECT "+columnProjectsUserID+", "+columnProjectsName+", "+columnProjectsStartedAt+", "+columnProjectsRuntime+", "+columnProjectsCreatedAt+", "+columnProjectsUpdatedAt+
			" FROM "+tableProjects+
			" WHERE "+columnProjectsUserID+"=$1 AND "+columnProjectsName+" ILIKE $2"+
			" ORDER BY "+columnProjectsStartedAt+", "+columnProjectsUpdatedAt+" DESC;",
		userID, searchTerm,
	)
	if err != nil {
		return nil, r.logger.LogAndAbstractError("database error", "Error getting projects: %+v", err)
	}

	projects := []*Project{}
	for res.Next() {
		project := &Project{}
		if err := res.Scan(&project.UserID, &project.Name, &project.StartedAt, &project.RuntimeInSeconds, &project.CreatedAt, &project.UpdatedAt); err != nil {
			return nil, r.logger.LogAndAbstractError("database error", "Error scanning project: %+v", err)
		}
		projects = append(projects, project)
	}

	for _, project := range projects {
		project.DatesToLocal()
	}

	return projects, nil
}

func (r *repositoryImpl) GetProject(userID, name string) (*Project, error) {
	var project = &Project{}
	if err := r.database.QueryRow(
		"SELECT "+columnProjectsUserID+", "+columnProjectsName+", "+columnProjectsStartedAt+", "+columnProjectsRuntime+", "+columnProjectsCreatedAt+", "+columnProjectsUpdatedAt+
			" FROM "+tableProjects+
			" WHERE "+columnProjectsUserID+"=$1 AND "+columnProjectsName+"=$2;",
		[]any{userID, name},
		&project.UserID, &project.Name, &project.StartedAt, &project.RuntimeInSeconds, &project.CreatedAt, &project.UpdatedAt,
	); err != nil {
		switch {
		case errors.As(err, &database.NoRowsError{}):
			return nil, fmt.Errorf("project '%s' not found", name)
		default:
			return nil, r.logger.LogAndAbstractError("database error", "Error scanning project: %+v", err)
		}
	}

	project.DatesToLocal()

	return project, nil
}

func (r *repositoryImpl) GetRunningProject(userID string) (*Project, error) {
	var project = &Project{}
	if err := r.database.QueryRow(
		"SELECT "+columnProjectsUserID+", "+columnProjectsName+", "+columnProjectsStartedAt+", "+columnProjectsRuntime+", "+columnProjectsCreatedAt+", "+columnProjectsUpdatedAt+
			" FROM "+tableProjects+
			" WHERE "+columnProjectsUserID+"=$1 AND "+columnProjectsStartedAt+" IS NOT NULL"+
			" LIMIT 1;",
		[]any{userID},
		&project.UserID, &project.Name, &project.StartedAt, &project.RuntimeInSeconds, &project.CreatedAt, &project.UpdatedAt,
	); err != nil {
		switch {
		case errors.As(err, &database.NoRowsError{}):
			return nil, nil
		default:
			return nil, r.logger.LogAndAbstractError("database error", "Error scanning project: %+v", err)
		}
	}

	project.DatesToLocal()

	return project, nil
}

func (r *repositoryImpl) DeleteProject(userID, name string) error {
	res, err := r.database.Exec(
		"DELETE"+
			" FROM "+tableProjects+
			" WHERE "+columnProjectsUserID+"=$1 AND "+columnProjectsName+"=$2;",
		userID, name)
	if err != nil {
		return r.logger.LogAndAbstractError("database error", "Couldn't delete project: %+v", err)
	}

	if rows, _ := res.RowsAffected(); rows != 1 {
		r.logger.Error("Couldn't find and delete project: %s", name)

		return &database.NoRowsError{
			Message: fmt.Sprintf("project '%s' not found", name),
		}
	}

	return nil
}

func (r *repositoryImpl) StartProject(userID, name string) error {
	project, err := r.GetProject(userID, name)
	if err != nil {
		return err
	}

	if project.StartedAt != nil {
		return fmt.Errorf("project already started")
	}

	runningProject, err := r.GetRunningProject(userID)
	if err != nil {
		return err
	}

	tx, err := r.database.Begin()
	if err != nil {
		return r.logger.LogAndAbstractError("database error", "Couldn't create transaction: %+v", err)
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
			" WHERE "+columnProjectsUserID+"=$1 AND "+columnProjectsName+"=$2;",
		userID, name,
	); err != nil {
		return r.logger.LogAndAbstractError("database error", "Couldn't start project '%s': %+v", name, err)
	}

	if runningProject != nil {
		err = r.stopProjectWithTx(tx, runningProject.UserID, runningProject.Name)
		if err != nil {
			return err
		}
	}

	tx.Commit()
	tx = nil

	return nil
}

func (r *repositoryImpl) StopProject(userID, name string) error {
	return r.stopProjectWithTx(nil, userID, name)
}

func (r *repositoryImpl) stopProjectWithTx(tx *sql.Tx, userID, name string) error {
	project, err := r.GetProject(userID, name)
	if err != nil {
		return r.logger.LogAndAbstractError("database error", "Failed to fetch project '%s': %+v", name, err)
	}

	if project.StartedAt == nil {
		return fmt.Errorf("project not running")
	}

	runtime := project.RuntimeInSeconds + uint64(time.Since(*project.StartedAt).Seconds())
	query := "UPDATE " + tableProjects +
		" SET " + columnProjectsRuntime + "=$1, " + columnProjectsStartedAt + "=NULL" +
		" WHERE " + columnProjectsUserID + "=$2 AND " + columnProjectsName + "=$3;"
	args := []any{runtime, userID, name}

	if tx == nil {
		_, err = r.database.Exec(query, args...)
	} else {
		_, err = r.database.ExecWithTx(tx, query, args...)
	}
	if err != nil {
		return r.logger.LogAndAbstractError("database error", "Couldn't stop project '%s': %+v", name, err)
	}

	return nil
}
