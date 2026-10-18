FROM golang:1.26 AS builder

WORKDIR /app

COPY pkg/go.mod pkg/go.sum ./
RUN go mod download

COPY pkg/ .

RUN CGO_ENABLED=0 go build -gcflags="all=-N -l" -o bin/time-track ./main.go

# -----------------------
FROM golang:1.26 AS debug

WORKDIR /app

RUN go install github.com/go-delve/delve/cmd/dlv@latest

COPY --from=builder /app .

HEALTHCHECK --interval=10s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -fsS http://127.0.0.1:80/health || exit 1

ENTRYPOINT ["dlv", "--listen=:2345", "--headless=true", "--api-version=2", "--accept-multiclient", "exec", "--continue", "/app/bin/time-track"]

# -----------------------
FROM alpine:latest AS prod

WORKDIR /app

COPY --from=builder /app/bin/time-track /app/bin/time-track

HEALTHCHECK --interval=10s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -q -O /dev/null http://127.0.0.1:80/health || exit 1

ENTRYPOINT ["/app/bin/time-track"]