package server

import (
	"fmt"
	"net/http"

	"github.com/DominikKuenkele/TimeTrack/libraries/logger"
)

type Server interface {
	Start() error
	AddHandler(pattern string, handler http.Handler)
}

type serverConfig struct {
	address string
	port    string
	mux     *http.ServeMux
	logger  logger.Logger
}

var _ Server = &serverConfig{}

func NewServer(address, port string, logger logger.Logger) Server {
	return &serverConfig{
		address: address,
		port:    port,
		mux:     http.NewServeMux(),
		logger:  logger,
	}
}

func (s *serverConfig) Start() error {
	url := fmt.Sprintf("%s:%s", s.address, s.port)

	s.logger.Info("Starting server on %s", url)

	return http.ListenAndServe(url, s.mux)
}

func (s *serverConfig) AddHandler(pattern string, handler http.Handler) {
	s.mux.Handle(pattern, s.logMiddleware(handler))
}

func (s *serverConfig) logMiddleware(h http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		s.logger.Info("Received request: %s %s", r.Method, r.URL.String())

		h.ServeHTTP(w, r)
	})
}
