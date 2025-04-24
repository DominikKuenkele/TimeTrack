package projects

import (
	"database/sql"
	"errors"
	"fmt"
	"slices"
	"time"

	"github.com/DominikKuenkele/TimeTrack/libraries/database"
	"github.com/DominikKuenkele/TimeTrack/libraries/logger"
	"github.com/DominikKuenkele/TimeTrack/libraries/utilitites"
	"github.com/lib/pq"
)

type Repository interface {
	AddProject(userID, name string) error
	GetProject(userID, name string) (*Project, error)
	GetRunningProject(userID string) (*Project, error)
	GetProjectsLike(userID, searchTerm string) ([]*Project, error)
	DeleteProject(userID, name string) error
	StartProject(userID, name string) error
	StopProject(userID, name string) error
	GetActivities(userID string, day time.Time) (Activities, error)
	ChangeActivity(userID string, activity Activity) error
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
	columnProjectsProjectID = "project_id"
	columnProjectsUserID    = "user_id"
	columnProjectsName      = "name"
	columnProjectsStartedAt = "started_at"
	columnProjectsCreatedAt = "created_at"
	columnProjectsUpdatedAt = "updated_at"

	tableActvities              = "activities"
	columnsActivitiesActivityID = "activity_id"
	columnsActivitiesProjectID  = "project_id"
	columnsActivitiesStartedAt  = "started_at"
	columnsActivitiesEndedAt    = "ended_at"
	columnsActivitiesCreatedAt  = "created_at"
	columnsActivitiesUpdatedAt  = "updated_at"
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

	rows, err := r.database.Query(
		"SELECT "+columnProjectsProjectID+", "+columnProjectsUserID+", "+columnProjectsName+", "+columnProjectsStartedAt+", "+columnProjectsCreatedAt+", "+columnProjectsUpdatedAt+
			" FROM "+tableProjects+
			" WHERE "+columnProjectsUserID+"=$1 AND "+columnProjectsName+" ILIKE $2"+
			" ORDER BY "+columnProjectsUpdatedAt+" DESC;",
		userID, searchTerm,
	)
	if err != nil {
		return nil, r.logger.LogAndAbstractError("database error", "Error getting projects: %+v", err)
	}
	defer rows.Close()

	projectOrder := []int{}
	projectMap := map[int]*Project{}
	for rows.Next() {
		project := &DbProject{}
		if err := rows.Scan(
			&project.ID,
			&project.UserID,
			&project.Name,
			&project.StartedAt,
			&project.CreatedAt,
			&project.UpdatedAt,
		); err != nil {
			return nil, r.logger.LogAndAbstractError("database error", "Error scanning project: %+v", err)
		}

		projectMap[project.ID] = project.ToDomain()
		projectOrder = append(projectOrder, project.ID)
	}

	if err = r.readActivities(projectMap); err != nil {
		return nil, err
	}

	projects := make([]*Project, 0, len(projectOrder))
	for _, projectID := range projectOrder {
		projectMap[projectID].RuntimeInSeconds = projectMap[projectID].Activities.CalculateRuntime()
		projects = append(projects, projectMap[projectID])
	}

	return projects, nil
}

func (r *repositoryImpl) readActivities(projects map[int]*Project) error {
	projectIDs := utilitites.MapKeysToSlice(projects)

	rows, err := r.database.Query(
		"SELECT"+
			" a."+columnsActivitiesActivityID+", a."+columnsActivitiesProjectID+", a."+columnsActivitiesStartedAt+", a."+columnsActivitiesEndedAt+", a."+columnsActivitiesCreatedAt+", a."+columnsActivitiesUpdatedAt+
			", p."+columnProjectsName+
			" FROM "+tableActvities+" a"+
			" LEFT JOIN "+tableProjects+" p ON a."+columnsActivitiesProjectID+"=p."+columnProjectsProjectID+
			" WHERE a."+columnsActivitiesProjectID+"=ANY($1);",
		pq.Array(projectIDs),
	)
	if err != nil {
		return r.logger.LogAndAbstractError("database error", "Error getting activities: %+v", err)
	}
	defer rows.Close()

	for rows.Next() {
		var projectID int
		activity := &DbActivity{}
		if err := rows.Scan(
			&activity.ID,
			&projectID,
			&activity.StartedAt,
			&activity.EndedAt,
			&activity.CreatedAt,
			&activity.UpdatedAt,
			&activity.ProjectName,
		); err != nil {
			return r.logger.LogAndAbstractError("database error", "Error scanning activities: %+v", err)
		}

		projects[projectID].Activities = append(projects[projectID].Activities, activity.ToDomain())
	}

	return nil
}

func (r *repositoryImpl) readSingleProject(whereClause string, args []any) (*Project, error) {
	project := &Project{}
	err := r.database.QueryRow(
		"SELECT"+
			" "+columnProjectsProjectID+", "+columnProjectsUserID+", "+columnProjectsName+", "+columnProjectsStartedAt+", "+columnProjectsCreatedAt+", "+columnProjectsUpdatedAt+
			" FROM "+tableProjects+
			" "+whereClause+
			" LIMIT 1;",
		args,
		&project.ID,
		&project.UserID,
		&project.Name,
		&project.StartedAt,
		&project.CreatedAt,
		&project.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}

	return project, nil
}

func (r *repositoryImpl) GetProject(userID, name string) (*Project, error) {
	project, err := r.readSingleProject(
		"WHERE "+columnProjectsUserID+"=$1 AND "+columnProjectsName+"=$2",
		[]any{userID, name},
	)
	if err != nil {
		switch {
		case errors.As(err, &database.NoRowsError{}):
			return nil, fmt.Errorf("project %s not found", name)
		default:
			return nil, r.logger.LogAndAbstractError("database error", "Error scanning project: %+v", err)
		}
	}

	projectMap := map[int]*Project{
		project.ID: project,
	}

	if err = r.readActivities(projectMap); err != nil {
		return nil, err
	}

	project.RuntimeInSeconds = project.Activities.CalculateRuntime()

	return project, nil
}

func (r *repositoryImpl) GetRunningProject(userID string) (*Project, error) {
	project, err := r.readSingleProject(
		"WHERE "+columnProjectsUserID+"=$1 AND "+columnProjectsStartedAt+" IS NOT NULL",
		[]any{userID},
	)
	if err != nil {
		switch {
		case errors.As(err, &database.NoRowsError{}):
			return nil, nil
		default:
			return nil, r.logger.LogAndAbstractError("database error", "Error scanning project: %+v", err)
		}
	}

	projectMap := map[int]*Project{
		project.ID: project,
	}

	if err = r.readActivities(projectMap); err != nil {
		return nil, err
	}

	project.RuntimeInSeconds = project.Activities.CalculateRuntime()

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
		"INSERT INTO "+tableActvities+
			" ("+columnsActivitiesProjectID+", "+columnsActivitiesStartedAt+")"+
			" VALUES ($1, NOW());",
		project.ID,
	); err != nil {
		return r.logger.LogAndAbstractError("database error", "Couldn't start project '%s': %+v", name, err)
	}

	if _, err := r.database.ExecWithTx(
		tx,
		"UPDATE "+tableProjects+
			" SET "+columnProjectsStartedAt+"=NOW()"+
			" WHERE "+columnProjectsProjectID+"=$1;",
		project.ID,
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

	externalTx := tx != nil
	if !externalTx {
		tx, err = r.database.Begin()
		if err != nil {
			return r.logger.LogAndAbstractError("database error", "Couldn't create transaction: %+v", err)
		}
		defer func() {
			if tx != nil {
				r.logger.Info("Rolling back transaction while stopping project")
				if err := tx.Rollback(); err != nil {
					r.logger.Error("Failed to rollback transaction: %+v", err)
				}
			}
		}()
	}

	_, err = r.database.ExecWithTx(
		tx,
		"UPDATE "+tableActvities+
			" SET "+columnsActivitiesEndedAt+"=NOW()"+
			" WHERE "+columnsActivitiesProjectID+"=$1 AND "+columnsActivitiesEndedAt+" IS NULL;",
		project.ID,
	)
	if err != nil {
		return r.logger.LogAndAbstractError("database error", "Couldn't stop project '%s': %+v", name, err)
	}

	_, err = r.database.ExecWithTx(
		tx,
		"UPDATE "+tableProjects+
			" SET "+columnProjectsStartedAt+"=NULL"+
			" WHERE "+columnProjectsProjectID+"=$1;",
		project.ID,
	)
	if err != nil {
		return r.logger.LogAndAbstractError("database error", "Couldn't stop project '%s': %+v", name, err)
	}

	if !externalTx {
		tx.Commit()
		tx = nil
	}

	return nil
}

func (r *repositoryImpl) GetActivities(userID string, day time.Time) (Activities, error) {
	rows, err := r.database.Query(
		"SELECT"+
			" a."+columnsActivitiesActivityID+", a."+columnsActivitiesStartedAt+", a."+columnsActivitiesEndedAt+", a."+columnsActivitiesCreatedAt+", a."+columnsActivitiesUpdatedAt+
			", p."+columnProjectsName+
			" FROM "+tableActvities+" a"+
			" LEFT JOIN "+tableProjects+" p ON a."+columnsActivitiesProjectID+"=p."+columnProjectsProjectID+
			" WHERE a."+columnsActivitiesStartedAt+"::date = $1 AND p."+columnProjectsUserID+"=$2"+
			" ORDER BY a."+columnsActivitiesStartedAt+" ASC;",
		day.Format("2006-01-02"),
		userID,
	)
	if err != nil {
		switch {
		case errors.As(err, &database.NoRowsError{}):
			return nil, nil
		default:
			return nil, r.logger.LogAndAbstractError("database error", "Error getting activities: %+v", err)
		}
	}
	defer rows.Close()

	activitySlice := Activities{}
	for rows.Next() {
		activity := &DbActivity{}
		if err := rows.Scan(
			&activity.ID,
			&activity.StartedAt,
			&activity.EndedAt,
			&activity.CreatedAt,
			&activity.UpdatedAt,
			&activity.ProjectName,
		); err != nil {
			return nil, r.logger.LogAndAbstractError("database error", "Error scanning activities: %+v", err)
		}

		activitySlice = append(activitySlice, activity.ToDomain())
	}

	slices.SortFunc(activitySlice, func(a, b *Activity) int {
		return a.StartedAt.Compare(b.StartedAt)
	})

	return activitySlice, nil
}

func (r *repositoryImpl) ChangeActivity(userID string, activity Activity) error {
	project, err := r.GetProject(userID, activity.ProjectName)
	if err != nil {
		return err
	}

	res, err := r.database.Exec(
		"UPDATE "+tableActvities+
			" SET "+columnsActivitiesProjectID+"=$1, "+columnsActivitiesStartedAt+"=$2, "+columnsActivitiesEndedAt+"=$3"+
			" WHERE "+columnsActivitiesActivityID+"=$4;",
		project.ID, activity.StartedAt, activity.EndedAt, activity.ID)
	if err != nil {
		return r.logger.LogAndAbstractError("database error", "Couldn't change activity: %+v", err)
	}

	rowsAffected, err := res.RowsAffected()
	if err != nil {
		return r.logger.LogAndAbstractError("database error", "Couldn't change activity: %+v", err)
	}

	if rowsAffected == 0 {
		return r.logger.LogAndAbstractError("database error", "activity '%d' not found", activity.ID)
	}

	return nil
}
