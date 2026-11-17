package server

import (
	"fmt"
	"net/http"

	"github.com/DominikKuenkele/TimeTrack/libraries/logger"
)

const apiPrefix = "/api"

type Server interface {
	Start() error
	AddHandler(pattern string, handler http.HandlerFunc)
	AddAPIHandler(pattern string, handler http.HandlerFunc)
}

type serverConfig struct {
	address string
	port    string
	mux     *http.ServeMux
	apiMux  *http.ServeMux
	logger  logger.Logger
}

var _ Server = &serverConfig{}

func NewServer(address, port string, logger logger.Logger) Server {
	s := &serverConfig{
		address: address,
		port:    port,
		mux:     http.NewServeMux(),
		apiMux:  http.NewServeMux(),
		logger:  logger,
	}
	s.mux.Handle(apiPrefix+"/", http.StripPrefix(apiPrefix, s.apiMux))
	return s
}

func (s *serverConfig) Start() error {
	url := fmt.Sprintf("%s:%s", s.address, s.port)

	s.logger.Info("Starting server on %s", url)

	return http.ListenAndServe(url, s.mux)
}

func (s *serverConfig) AddHandler(pattern string, handler http.HandlerFunc) {
	s.mux.Handle(pattern, s.logMiddleware(handler))
}

func (s *serverConfig) AddAPIHandler(pattern string, handler http.HandlerFunc) {
	s.apiMux.Handle(pattern, s.logMiddleware(handler))
}

func (s *serverConfig) logMiddleware(h http.HandlerFunc) http.HandlerFunc {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		s.logger.Info("Received request: %s %s", r.Method, r.URL.String())

		h.ServeHTTP(w, r)
	})
}
