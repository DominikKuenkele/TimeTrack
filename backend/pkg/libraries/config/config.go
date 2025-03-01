package config

import (
	"github.com/caarlos0/env"
)

type Config struct {
	PostgresHost     string `env:"POSTGRES_HOST,required"`
	PostgresDB       string `env:"POSTGRES_DB,required"`
	PostgresUser     string `env:"POSTGRES_USER,required"`
	PostgresPassword string `env:"POSTGRES_PASSWORD,required"`
}

func ReadConfig() (Config, error) {
	var cfg Config
	err := env.Parse(&cfg)

	return cfg, err
}
