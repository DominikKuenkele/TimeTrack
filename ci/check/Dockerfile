ARG GO_VERSION=1.26
ARG NODE_VERSION=24

FROM golang:${GO_VERSION}-trixie AS go
ARG TASK_VERSION=3.54.0
RUN go install github.com/go-task/task/v3/cmd/task@v${TASK_VERSION}

FROM node:${NODE_VERSION}-trixie
COPY --from=go /usr/local/go /usr/local/go
COPY --from=go /go/bin/task /usr/local/bin/task
ENV GOPATH=/go PATH=/go/bin:/usr/local/go/bin:$PATH
