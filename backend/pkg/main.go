package main

import (
	"net/http"

	"github.com/DominikKuenkele/TimeTrack/authentification"
	"github.com/DominikKuenkele/TimeTrack/libraries/config"
	"github.com/DominikKuenkele/TimeTrack/libraries/database"
	"github.com/DominikKuenkele/TimeTrack/libraries/logger"
	"github.com/DominikKuenkele/TimeTrack/libraries/server"
	"github.com/DominikKuenkele/TimeTrack/projects"
)

func defaultHandler(l logger.Logger) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		l.Error("Couldn't handle request")
		w.WriteHeader(404)
	}
}

func main() {
	cfg, err := config.ReadConfig()
	if err != nil {
		panic(err)
	}

	logger, err := logger.NewLogger(cfg.LogLevel)
	if err != nil {
		panic(err)
	}

	database, err := database.NewDatabase(logger, database.Config{
		PostgresHost:     cfg.PostgresHost,
		PostgresDB:       cfg.PostgresDB,
		PostgresUser:     cfg.PostgresUser,
		PostgresPassword: cfg.PostgresPassword,
	})
	if err != nil {
		logger.Error("Couldn't create database: %+v", err)
		return
	}
	defer database.Close()

	server := server.NewServer("", "80", logger)
	server.AddHandler("/", defaultHandler(logger))

	authenticator, err := authentification.BuildAuthenticator(logger, database)
	if err != nil {
		logger.Error(err.Error())
		return
	}
	server.AddHandler(authentification.Prefix+"/", authenticator.HTTPHandler)

	project, err := projects.BuildProject(logger, database)
	if err != nil {
		logger.Error(err.Error())
		return
	}
	server.AddHandler(projects.Prefix+"/", authenticator.Authenticate(project.HTTPHandler))

	if err := server.Start(); err != nil {
		logger.Error(err.Error())
	}
}
