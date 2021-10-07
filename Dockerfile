FROM golang:1.15-buster AS builder
WORKDIR /go/src
#RUN go get -d -v github.com/gorilla/mux && go get -d -v github.com/google/uuid
COPY main.go .
COPY go.mod .
COPY go.sum .
COPY observation/ ./observation
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o app .

FROM alpine:3.12
RUN apk --no-cache add ca-certificates
WORKDIR /root/
COPY --from=builder /go/src/app .
EXPOSE 10000
CMD ["./app"]