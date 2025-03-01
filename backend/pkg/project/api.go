package project

import (
	"net/http"
)

func (i *impl) ProjectHandler(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case "GET":
		i.Get("test")
	case "POST":
		i.Add("test")
	case "DELETE":
		i.Delete("test")
	}
}
