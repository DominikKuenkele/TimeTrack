package logger

import (
	"errors"
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

type consoleLogger struct {
	logLevel loglevel.ID
}

var _ Logger = &consoleLogger{}

func (*consoleLogger) Log(format string, a ...any) {
	message := fmt.Sprintf(format, a...)
	log.Println(gray + message + reset)
}

func (i *consoleLogger) Debug(format string, a ...any) {
	if i.logLevel <= loglevel.Debug {
		message := fmt.Sprintf(format, a...)
		log.Println(white + strings.ToUpper(loglevel.Debug.String()) + ": " + message + reset)
	}
}

func (i *consoleLogger) Info(format string, a ...any) {
	if i.logLevel <= loglevel.Info {
		message := fmt.Sprintf(format, a...)
		log.Println(gray + strings.ToUpper(loglevel.Info.String()) + ": " + message + reset)
	}
}

func (i *consoleLogger) Warning(format string, a ...any) {
	if i.logLevel <= loglevel.Warning {
		message := fmt.Sprintf(format, a...)
		log.Println(yellow + strings.ToUpper(loglevel.Warning.String()) + ": " + message + reset)
	}
}

func (i *consoleLogger) Error(format string, a ...any) {
	if i.logLevel <= loglevel.Error {
		message := fmt.Sprintf(format, a...)
		log.Println(red + strings.ToUpper(loglevel.Error.String()) + ": " + message + reset)
	}
}

func (i *consoleLogger) LogAndAbstractError(errorMessage string, format string, args ...any) error {
	i.Error(format, args...)

	return errors.New(errorMessage)
}
