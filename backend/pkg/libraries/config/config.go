package config

import (
	"github.com/caarlos0/env/v11"
)

type Config struct {
	PostgresHost     string `env:"POSTGRES_HOST,required"`
	PostgresDB       string `env:"POSTGRES_DB,required"`
	PostgresUser     string `env:"POSTGRES_USER,required"`
	PostgresPassword string `env:"POSTGRES_PASSWORD,required"`

	FrontendAddress string `env:"FRONTEND_ADDRESS,required"`

	OAuthServerURL    string `env:"OAUTH_SERVER_URL,required"`
	OAuthDiscoveryURL string `env:"OAUTH_DISCOVERY_URL"`
	OAuthClientID     string `env:"OAUTH_CLIENT_ID,required"`

	LogLevel string `env:"LOG_LEVEL" envDefault:"debug"`
	LogFile  string `env:"LOG_FILE"`
}

func ReadConfig() (Config, error) {
	var cfg Config
	err := env.Parse(&cfg)
	if err != nil {
		return cfg, err
	}

	if cfg.OAuthDiscoveryURL == "" {
		cfg.OAuthDiscoveryURL = cfg.OAuthServerURL
	}

	return cfg, nil
}
