package main

import (
	"net/http"

	"github.com/DominikKuenkele/TimeTrack/libraries/config"
	"github.com/DominikKuenkele/TimeTrack/libraries/database"
	"github.com/DominikKuenkele/TimeTrack/libraries/logger"
	"github.com/DominikKuenkele/TimeTrack/libraries/server"
	"github.com/DominikKuenkele/TimeTrack/project"
)

func defaultHandler(l logger.Logger) func(http.ResponseWriter, *http.Request) {
	return func(w http.ResponseWriter, r *http.Request) {
		l.Error("Couldn't handle request")
		w.WriteHeader(404)
	}
}

func main() {
	logger := logger.NewLogger()

	cfg, err := config.ReadConfig()
	if err != nil {
		logger.Error("Couldn't load config: %+v", err)
		return
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

	server := server.NewServer("", "80", logger)
	server.AddHandler("/", http.HandlerFunc(defaultHandler(logger)))

	project := project.BuildProject(logger, database)
	server.AddHandler("/project", http.HandlerFunc(project.HTTPHandler))

	if err := server.Start(); err != nil {
		logger.Error(err.Error())
	}
}
