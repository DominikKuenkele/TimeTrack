package server

import (
	"fmt"
	"net/http"

	"github.com/DominikKuenkele/TimeTrack/libraries/logger"
)

type Server interface {
	Start() error
	AddHandler(pattern string, handler http.HandlerFunc)
}

type serverConfig struct {
	address         string
	port            string
	frontendAddress string
	mux             *http.ServeMux
	logger          logger.Logger
}

var _ Server = &serverConfig{}

func NewServer(address, port, frontendAddress string, logger logger.Logger) Server {
	return &serverConfig{
		address:         address,
		port:            port,
		frontendAddress: frontendAddress,
		mux:             http.NewServeMux(),
		logger:          logger,
	}
}

func (s *serverConfig) Start() error {
	url := fmt.Sprintf("%s:%s", s.address, s.port)

	s.logger.Info("Starting server on %s", url)

	return http.ListenAndServe(url, s.mux)
}

func (s *serverConfig) AddHandler(pattern string, handler http.HandlerFunc) {
	s.mux.Handle(pattern, s.corsMiddleware(s.logMiddleware(handler)))
}

func (s *serverConfig) logMiddleware(h http.HandlerFunc) http.HandlerFunc {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		s.logger.Info("Received request: %s %s", r.Method, r.URL.String())

		h.ServeHTTP(w, r)
	})
}

func (s *serverConfig) corsMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", s.frontendAddress)
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		w.Header().Set("Access-Control-Allow-Credentials", "true")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}
