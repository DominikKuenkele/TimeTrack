package logger

import (
	"fmt"
	"log"
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
	Info(format string, a ...any)
	Warning(format string, a ...any)
	Error(format string, a ...any)
}

type Impl struct{}

func NewLogger() Logger {
	return &Impl{}
}

var _ Logger = &Impl{}

func (*Impl) Info(format string, a ...any) {
	message := fmt.Sprintf(format, a...)
	log.Println(gray + message + reset)
}

func (*Impl) Error(format string, a ...any) {
	message := fmt.Sprintf(format, a...)
	log.Println(red + message + reset)
}

func (*Impl) Warning(format string, a ...any) {
	message := fmt.Sprintf(format, a...)
	log.Println(yellow + message + reset)
}
