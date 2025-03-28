package logger

import (
	"github.com/DominikKuenkele/TimeTrack/libraries/logger/loglevel"
)

type Logger interface {
	Log(format string, a ...any)
	Debug(format string, a ...any)
	Info(format string, a ...any)
	Warning(format string, a ...any)
	Error(format string, a ...any)
	LogAndAbstractError(errorMessage string, format string, a ...any) error
}

func NewLogger(level, logfile string) (Logger, error) {
	logLevelID, err := loglevel.FromString(level)
	if err != nil {
		return nil, err
	}

	var logger Logger
	if logfile != "" {
		logger = &fileLogger{
			logLevel: logLevelID,
			logFile:  logfile,
		}
	} else {
		logger = &consoleLogger{
			logLevel: logLevelID,
		}
	}

	logger.Log("Created logger with log level %s", logLevelID)

	return logger, nil
}
