FROM golang:1.27@sha256:205c7636d74e0ffbe3d007162df7d74f859f5a8c8322dfb9f907977686c126cf AS builder

WORKDIR /app

COPY pkg/go.mod pkg/go.sum ./
RUN go mod download

COPY pkg/ .

RUN CGO_ENABLED=0 go build -gcflags="all=-N -l" -o bin/time-track ./main.go

# -----------------------
FROM golang:1.27@sha256:205c7636d74e0ffbe3d007162df7d74f859f5a8c8322dfb9f907977686c126cf AS debug

WORKDIR /app

RUN go install github.com/go-delve/delve/cmd/dlv@latest

COPY --from=builder /app .

HEALTHCHECK --interval=10s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -fsS http://127.0.0.1:80/health || exit 1

ENTRYPOINT ["dlv", "--listen=:2345", "--headless=true", "--api-version=2", "--accept-multiclient", "exec", "--continue", "/app/bin/time-track"]

# -----------------------
FROM alpine:latest@sha256:f59abe656b692d901e184be3445e084786602108599d2a51d229c0f5a48c71bf AS prod

WORKDIR /app

COPY --from=builder /app/bin/time-track /app/bin/time-track

HEALTHCHECK --interval=10s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -q -O /dev/null http://127.0.0.1:80/health || exit 1

ENTRYPOINT ["/app/bin/time-track"]