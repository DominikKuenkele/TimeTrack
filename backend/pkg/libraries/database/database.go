package database

import (
	"errors"

	"github.com/DominikKuenkele/TimeTrack/libraries/logger"
)

type Config struct {
	PostgresHost     string
	PostgresDB       string
	PostgresUser     string
	PostgresPassword string
}

type Database interface {
	Exec(query string)
}

type impl struct {
	logger logger.Logger
	config Config
}

var _ Database = &impl{}

func NewDatabase(logger logger.Logger, config Config) (Database, error) {
	if config.PostgresHost == "" || config.PostgresDB == "" || config.PostgresUser == "" || config.PostgresPassword == "" {
		return nil, errors.New("Condig not valid")
	}

	return &impl{
		logger: logger,
		config: config,
	}, nil
}

func (i *impl) Exec(query string) {
	i.logger.Info("Exec query '%s'", query)
}
