package main

import (
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

// ConnectToRabbit connects to rabbit via connection string generated from
func ConnectToRabbit() (*amqp.Connection, error) {
	return amqp.Dial(initRabbitConfig())
}

func initRabbitConfig() string {
	return fmt.Sprintf("amqp://%s:%s@%s:%d", rabbitUser, rabbitPassword, rabbitHost, rabbitPort)
}

// Send sends message to Rabbit
func Send(conf Config, data []byte) error {
	return conf.Channel.Publish(
		"",              // exchange
		conf.Queue.Name, // routing key
		false,           // mandatory
		false,           // immediate
		amqp.Publishing{
			ContentType: "application/json",
			Body:        data,
		})
}
