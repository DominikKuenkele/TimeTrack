package logger

import (
	"fmt"
	"log"
	"strings"

	"github.com/DominikKuenkele/TimeTrack/libraries/logger/loglevel"
)

const (
	reset   = "\033[0m"
	red     = "\033[31m"
	green   = "\033[32m"
	yellow  = "\033[33m"
	blue    = "\033[34m"
	magenta = "\033[35m"
	cyan    = "\033[36m"
	gray    = "\033[37m"
	white   = "\033[97m"
)

type Logger interface {
	Log(format string, a ...any)
	Debug(format string, a ...any)
	Info(format string, a ...any)
	Warning(format string, a ...any)
	Error(format string, a ...any)
	LogAndAbstractError(errorMessage string, format string, a ...any) error
}

type impl struct {
	logLevel loglevel.ID
}

func NewLogger(level string) (Logger, error) {
	logLevelID, err := loglevel.FromString(level)
	if err != nil {
		return nil, err
	}

	logger := &impl{
		logLevel: logLevelID,
	}

	logger.Log("Created logger with log level %s", logLevelID)

	return logger, nil
}

var _ Logger = &impl{}

func (*impl) Log(format string, a ...any) {
	message := fmt.Sprintf(format, a...)
	log.Println(gray + message + reset)
}

func (i *impl) Debug(format string, a ...any) {
	if i.logLevel <= loglevel.Debug {
		message := fmt.Sprintf(format, a...)
		log.Println(white + strings.ToUpper(loglevel.Debug.String()) + ": " + message + reset)
	}
}

func (i *impl) Info(format string, a ...any) {
	if i.logLevel <= loglevel.Info {
		message := fmt.Sprintf(format, a...)
		log.Println(gray + strings.ToUpper(loglevel.Info.String()) + ": " + message + reset)
	}
}

func (i *impl) Warning(format string, a ...any) {
	if i.logLevel <= loglevel.Warning {
		message := fmt.Sprintf(format, a...)
		log.Println(yellow + strings.ToUpper(loglevel.Warning.String()) + ": " + message + reset)
	}
}

func (i *impl) Error(format string, a ...any) {
	if i.logLevel <= loglevel.Error {
		message := fmt.Sprintf(format, a...)
		log.Println(red + strings.ToUpper(loglevel.Error.String()) + ": " + message + reset)
	}
}

func (i *impl) LogAndAbstractError(errorMessage string, format string, args ...any) error {
	i.Error(format, args...)

	return fmt.Errorf(errorMessage)
}
