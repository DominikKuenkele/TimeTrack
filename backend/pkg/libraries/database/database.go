package database

import (
	"database/sql"
	"errors"
	"fmt"

	"github.com/DominikKuenkele/TimeTrack/libraries/logger"
	"github.com/lib/pq"
)

type Config struct {
	PostgresHost     string
	PostgresDB       string
	PostgresUser     string
	PostgresPassword string
}

type Database interface {
	Exec(query string, args ...any) (sql.Result, error)
	Query(query string, args ...any) (*sql.Rows, error)
	QueryRow(query string, args []any, dest ...any) error
	Close()
}

type impl struct {
	logger logger.Logger
	db     *sql.DB
}

var _ Database = &impl{}

func NewDatabase(logger logger.Logger, config Config) (Database, error) {
	if config.PostgresHost == "" || config.PostgresDB == "" || config.PostgresUser == "" || config.PostgresPassword == "" {
		return nil, errors.New("Condig not valid")
	}

	connStr := fmt.Sprintf(
		"host=%s user=%s password=%s dbname=%s sslmode=disable",
		config.PostgresHost,
		config.PostgresUser,
		config.PostgresPassword,
		config.PostgresDB,
	)
	db, err := sql.Open("postgres", connStr)
	if err != nil {
		return nil, err
	}

	err = db.Ping()
	if err != nil {
		return nil, err
	}

	logger.Info("Established connection to database")

	return &impl{
		logger: logger,
		db:     db,
	}, nil
}

func (i *impl) Exec(query string, args ...any) (sql.Result, error) {
	i.logger.Debug("Exec '%s' with args", query, args)

	res, err := i.db.Exec(query, args...)
	err = selectPqError(err)

	return res, err
}

func (i *impl) Query(query string, args ...any) (*sql.Rows, error) {
	i.logger.Debug("Query '%s' with args", query, args)

	res, err := i.db.Query(query, args...)
	err = selectPqError(err)

	return res, err
}

func (i *impl) QueryRow(query string, args []any, dest ...any) error {
	i.logger.Debug("Query row '%s' with args", query, args)

	row := i.db.QueryRow(query, args...)
	if err := row.Scan(dest...); err != nil {
		switch {
		case errors.Is(err, sql.ErrNoRows):
			return NoRowsError{
				Message: fmt.Sprintf("No row matched query '%s'", query),
				Err:     err,
			}
		default:
			return selectPqError(err)
		}
	}

	return nil
}

func (i *impl) Close() {
	i.db.Close()
}

func selectPqError(err error) error {
	var pqError *pq.Error
	if err != nil && errors.As(err, &pqError) {
		switch pqError.Code {
		case "23505":
			return DuplicateError{
				Message: pqError.Message,
				Err:     pqError,
			}
		}
	}

	return err
}
