package main

import (
	"fmt"
	"net/http"

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

func projectHandler(w http.ResponseWriter, r *http.Request) {
	fmt.Fprintf(w, "Hello, world!")
}

func main() {
	logger := logger.NewLogger()

	server := server.NewServer("", "80", logger)
	server.AddHandler("/", http.HandlerFunc(defaultHandler(logger)))

	projectHandler := project.NewHandler(logger)
	server.AddHandler("/project", http.HandlerFunc(projectHandler.ProjectHandler))

	if err := server.Start(); err != nil {
		logger.Error(err.Error())
	}
}
