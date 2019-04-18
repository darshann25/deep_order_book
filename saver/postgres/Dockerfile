FROM golang:1.11 AS builder

WORKDIR /app

COPY go.sum go.sum
COPY go.mod go.mod
RUN go mod download

COPY config.yaml /app/config.yaml
COPY main.go main.go
COPY util.go util.go

ENV GO111MODULE=on

# Build Saver
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build

FROM scratch
COPY --from=builder /app/postgres /app/
COPY --from=builder /app/config.yaml /configs/config.yaml
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/ca-certificates.crt


ENTRYPOINT [ "/app/postgres" ]
CMD [ "--config", "/configs/config.yaml" ]



