package projects

import "time"

type Project struct {
	ID   int32
	Name string
}

type Tracking struct {
	ID        int32
	StartTime time.Time
	EndTime   time.Time
}
