FROM golang:1.24 AS builder

WORKDIR /app

COPY pkg/go.mod pkg/go.sum ./
RUN go mod download

COPY pkg/ .

RUN CGO_ENABLED=0 go build -gcflags="all=-N -l" -o bin/time-track ./main.go

# -----------------------
FROM golang:1.24 AS debug

WORKDIR /app

RUN go install github.com/go-delve/delve/cmd/dlv@latest

COPY --from=builder /app .

ENTRYPOINT ["dlv", "--listen=:2345", "--headless=true", "--api-version=2", "--accept-multiclient", "exec", "/app/bin/time-track"]

# -----------------------
FROM alpine:latest AS prod

WORKDIR /app

COPY --from=builder /app/bin/time-track /app/bin/time-track

ENTRYPOINT ["/app/bin/time-track"]