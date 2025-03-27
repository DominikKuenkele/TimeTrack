package config

import (
	"github.com/caarlos0/env/v11"
)

type Config struct {
	PostgresHost     string `env:"POSTGRES_HOST,required"`
	PostgresDB       string `env:"POSTGRES_DB,required"`
	PostgresUser     string `env:"POSTGRES_USER,required"`
	PostgresPassword string `env:"POSTGRES_PASSWORD,required"`

	FrontendAddress string `env:FRONTEND_ADDRESS,required`

	LogLevel string `env:"LOG_LEVEL" envDefault:"debug"`

	EnableCreateUser bool `env:"ENABLE_CREATE_USER" envDefault:"false"`
}

func ReadConfig() (Config, error) {
	var cfg Config
	err := env.Parse(&cfg)

	return cfg, err
}
