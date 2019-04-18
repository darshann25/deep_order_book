package main

import (
	"encoding/json"
	"fmt"

	"github.com/spf13/viper"

	"github.com/streadway/amqp"
)

var rabbitUser string
var rabbitPassword string
var rabbitHost string
var rabbitPort int

func init() {
	rabbitHost = viper.GetString("rabbit.host")
	rabbitUser = viper.GetString("rabbit.user")
	rabbitPassword = viper.GetString("rabbit.password")
	rabbitPort = viper.GetInt("rabbit.port")
}

// Config handles connecting ot rabbit
type Config struct {
	Channel *amqp.Channel
	Queue   *amqp.Queue
}

// WorkerMessage a message coming from a worker
type WorkerMessage struct {
	Exchange string `json:"exchange"`
	Data     []byte `json:"data"`
}

// ConnectToRabbit connects to rabbit via connection string generated from
func ConnectToRabbit() (*amqp.Connection, error) {
	return amqp.Dial(initRabbitConfig())
}

func initRabbitConfig() string {
	return fmt.Sprintf("amqp://%s:%s@%s:%d", rabbitUser, rabbitPassword, rabbitHost, rabbitPort)
}

// Send sends message to Rabbit
func Send(conf Config, exchange string, data []byte) error {
	d := WorkerMessage{
		Exchange: exchange,
		Data:     data,
	}

	b, err := json.Marshal(d)
	if err != nil {
		return err
	}

	return conf.Channel.Publish(
		"",              // exchange
		conf.Queue.Name, // routing key
		false,           // mandatory
		false,           // immediate
		amqp.Publishing{
			ContentType: "application/json",
			Body:        b,
		})
}
