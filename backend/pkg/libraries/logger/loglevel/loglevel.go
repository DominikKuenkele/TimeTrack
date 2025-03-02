package loglevel

import (
	"fmt"
	"strings"
)

type ID uint8

const (
	Undefined ID = 1 << iota
	Debug
	Info
	Warning
	Error
)

func FromString(logLevel string) (ID, error) {
	switch strings.ToLower(logLevel) {
	case "debug":
		return Debug, nil
	case "info":
		return Info, nil
	case "warning":
		return Warning, nil
	case "error":
		return Error, nil
	default:
		return Undefined, fmt.Errorf("Couldn't parse log level '%s'", logLevel)
	}
}

func (id ID) String() string {
	switch id {
	case Debug:
		return "debug"
	case Info:
		return "info"
	case Warning:
		return "warning"
	case Error:
		return "error"
	default:
		return "undefined"
	}
}
