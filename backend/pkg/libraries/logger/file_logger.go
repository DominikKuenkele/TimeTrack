package logger

import (
	"errors"
	"fmt"
	"log"
	"os"
	"strings"

	"github.com/DominikKuenkele/TimeTrack/libraries/logger/loglevel"
)

type fileLogger struct {
	logLevel loglevel.ID
	logFile  string
}

var _ Logger = &fileLogger{}

func (f *fileLogger) Log(format string, a ...any) {
	message := fmt.Sprintf(format, a...)
	f.writeToFile(message)
}

func (f *fileLogger) Debug(format string, a ...any) {
	if f.logLevel <= loglevel.Debug {
		message := fmt.Sprintf(format, a...)
		f.writeToFile(strings.ToUpper(loglevel.Debug.String()) + ": " + message)
	}
}

func (f *fileLogger) Info(format string, a ...any) {
	if f.logLevel <= loglevel.Info {
		message := fmt.Sprintf(format, a...)
		f.writeToFile(strings.ToUpper(loglevel.Info.String()) + ": " + message)
	}
}

func (f *fileLogger) Warning(format string, a ...any) {
	if f.logLevel <= loglevel.Warning {
		message := fmt.Sprintf(format, a...)
		f.writeToFile(strings.ToUpper(loglevel.Warning.String()) + ": " + message)
	}
}

func (f *fileLogger) Error(format string, a ...any) {
	if f.logLevel <= loglevel.Error {
		message := fmt.Sprintf(format, a...)
		f.writeToFile(strings.ToUpper(loglevel.Error.String()) + ": " + message)
	}
}

func (i *fileLogger) LogAndAbstractError(errorMessage string, format string, args ...any) error {
	i.Error(format, args...)

	return errors.New(errorMessage)
}

func (i *fileLogger) writeToFile(message string) {
	file, err := os.OpenFile(i.logFile, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	if err != nil {
		fmt.Println("Error opening file:", err)
		return
	}
	defer file.Close()

	log.SetOutput(file)

	content := []byte(message + "\n")

	log.Println(content)
}
