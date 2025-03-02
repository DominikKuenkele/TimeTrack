package database

type DuplicateError struct {
	Message string
	Err     error
}

func (e *DuplicateError) Error() string {
	return e.Message
}

func (e *DuplicateError) Unwrap() error {
	return e.Err
}

type NoRowsError struct {
	Message string
	Err     error
}

func (e *NoRowsError) Error() string {
	return e.Message
}

func (e *NoRowsError) Unwrap() error {
	return e.Err
}
