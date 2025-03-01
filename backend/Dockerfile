FROM golang:1.23

WORKDIR /usr/src/time-track

COPY ./pkg/go.mod ./
RUN go mod download
RUN go install github.com/go-delve/delve/cmd/dlv@latest

COPY ./pkg .
RUN go build -gcflags "all=-N -l" -v -o /usr/local/bin/time-track main.go

EXPOSE 80
EXPOSE 2345

CMD ["dlv", "exec", "/usr/local/bin/time-track", "--headless", "--listen=:2345", "--api-version=2", "--accept-multiclient"]