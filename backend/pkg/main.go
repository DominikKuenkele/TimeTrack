package main

import (
	"fmt"
	"net/http"
)

func defaultHandler(w http.ResponseWriter, r *http.Request) {
	fmt.Printf("Received: %s - %s\n", r.Method, r.URL)
	w.WriteHeader(404)
}

func projectHandler(w http.ResponseWriter, r *http.Request) {
	fmt.Println("Handling Project")
	fmt.Fprintf(w, "Hello, world!")
}

func main() {
	http.HandleFunc("/", defaultHandler)
	http.HandleFunc("/project", projectHandler)

	fmt.Println("Starting server on :80")
	if err := http.ListenAndServe(":80", nil); err != nil {
		fmt.Println("Error starting server:", err)
	}
}
