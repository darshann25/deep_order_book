package main

import (
	"bytes"
	"flag"
	"io/ioutil"
	"log"

	"github.com/streadway/amqp"

	"github.com/spf13/viper"
)

var (
	configFilePath string
	queueName      string
)

func init() {
	flag.StringVar(&configFilePath, "config", "configs/config.yml", "Specify the path to the configuration file for this environmane")
	flag.Parse()

	cfgFile, err := ioutil.ReadFile(configFilePath)
	if err != nil {
		panic(err)
	}

	viper.SetConfigType("yaml")
	viper.ReadConfig(bytes.NewBuffer(cfgFile))

	queueName = viper.GetString("rabbit.queue_name")
}

func main() {

	conn, err := amqp.Dial("amqp://guest:guest@localhost:5672")
	failOnError(err, "Failed to connect to RabbitMQ")
	defer conn.Close()

	ch, err := conn.Channel()
	failOnError(err, "failed to open channel")

	q, err := ch.QueueDeclare(
		queueName, // name
		false,     // durable
		false,     // delete when usused
		false,     // exclusive
		false,     // no-wait
		nil,       // arguments
	)
	failOnError(err, "Failed to declare Queue")

	messages, err := ch.Consume(
		q.Name, // queue
		"",     // consumer
		true,   // auto-ack
		false,  // exclusive
		false,  // no-local
		false,  // no-wait
		nil,    // args
	)
	failOnError(err, "Dailed to register consumer")

	// TODO: connect to db

	for d := range messages {
		go func(d amqp.Delivery) {
			log.Printf("Received a message: %s", d.Body)
		}(d)
	}

}

func failOnError(err error, msg string) {
	if err != nil {
		log.Fatalf("%s: %s", msg, err)
	}
}
