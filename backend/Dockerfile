FROM golang:1.23

WORKDIR /usr/src/time-track

COPY ./pkg/go.mod ./pkg/go.sum ./
RUN go mod download

RUN CGO_ENABLED=0 go install -ldflags "-s -w -extldflags '-static'" github.com/go-delve/delve/cmd/dlv@latest

COPY ./pkg .
RUN CGO_ENABLED=0 go build -gcflags "all=-N -l" -o /usr/local/bin/time-track main.go

EXPOSE 80 2345

CMD ["dlv", "exec", "/usr/local/bin/time-track", "--headless", "--listen=:2345", "--api-version=2", "--accept-multiclient"]