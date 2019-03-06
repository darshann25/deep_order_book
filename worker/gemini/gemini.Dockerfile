FROM golang:1.11 AS builder

WORKDIR /app

COPY go.sum go.sum
COPY go.mod go.mod
RUN go mod download

COPY config.yaml config.yaml
COPY main.go main.go
COPY rabbit.go rabbit.go

ENV GO111MODULE=on

# Build Worker
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o /app/gemini

# FROM scratch
FROM alpine:3.8
RUN apk add --update --no-cache ca-certificates

WORKDIR /app

COPY --from=builder /app/gemini /app/
COPY --from=builder /app/config.yaml /app/configs/config.yaml
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/ca-certificates.crt

ENTRYPOINT [ "./gemini" ]
CMD [ "--config", "configs/config.yaml" ]



