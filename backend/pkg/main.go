package main

import (
	"context"
	"net/http"
	"time"

	"github.com/DominikKuenkele/TimeTrack/activities"
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

func healthHandler(l logger.Logger, db database.Database) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		ctx, cancel := context.WithTimeout(r.Context(), 3*time.Second)
		defer cancel()

		if err := db.Ping(ctx); err != nil {
			l.Error("Health check failed: %v", err)
			w.WriteHeader(http.StatusServiceUnavailable)
			return
		}
		w.WriteHeader(http.StatusOK)
	}
}

func main() {
	cfg, err := config.ReadConfig()
	if err != nil {
		panic(err)
	}

	logger, err := logger.NewLogger(cfg.LogLevel, cfg.LogFile)
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

	server := server.NewServer("", "80", cfg.FrontendAddress, logger)
	server.AddHandler("/", defaultHandler(logger))
	server.AddHandler("/health", healthHandler(logger, database))

	authenticatorAPI, err := authentification.BuildAuthenticator(
		logger,
		cfg.OAuthServerURL,
		cfg.OAuthDiscoveryURL,
		cfg.OAuthClientID,
	)
	if err != nil {
		logger.Error("%v", err)
		return
	}

	projectAPI, err := projects.BuildProject(logger, database)
	if err != nil {
		logger.Error("%v", err)
		return
	}
	server.AddHandler(projects.Prefix+"/", authenticatorAPI.Authenticate(projectAPI.HTTPHandler))

	activityAPI, err := activities.BuildActivity(logger, database)
	if err != nil {
		logger.Error("%v", err)
		return
	}
	server.AddHandler(activities.Prefix+"/", authenticatorAPI.Authenticate(activityAPI.HTTPHandler))

	if err := server.Start(); err != nil {
		logger.Error("%v", err)
	}
}
