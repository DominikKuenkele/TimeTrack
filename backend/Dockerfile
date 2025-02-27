FROM golang:1.23

WORKDIR /usr/src/time-track

COPY ./pkg/go.mod ./
RUN go mod download

COPY ./pkg/ .
RUN go build -v -o /usr/local/bin/time-track ./...

EXPOSE 80

CMD ["time-track"]
