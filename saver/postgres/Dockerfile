FROM golang:1.11 AS builder

WORKDIR /app

COPY config.yaml /app/config.yaml
COPY go.sum go.sum
COPY go.mod go.mod
COPY main.go main.go

ENV GO111MODULE=on

RUN go mod download

# Build Worker
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build

FROM scratch
COPY --from=builder /app/coinbase /app/
COPY --from=builder /app/config.yaml /configs/config.yaml
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/ca-certificates.crt


ENTRYPOINT [ "/app/coinbase" ]
CMD [ "--config", "/configs/config.yaml" ]



