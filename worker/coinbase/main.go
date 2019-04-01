package main

import (
	"bytes"
	"flag"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"sync"

	"github.com/spf13/viper"
)

var (
	queueName      string
	configFilePath string
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
	conn, err := ConnectToRabbit()
	failOnError(err, "Failed connecting to Rabbit")
	defer conn.Close()

	ch, err := conn.Channel()
	failOnError(err, "Failed to open channel")
	defer ch.Close()

	q, err := ch.QueueDeclare(
		queueName, // name
		false,     // durable
		false,     // delete when unused
		false,     // exclusive
		false,     // no wait
		nil,       // arguemnts
	)
	failOnError(err, "Failed declaring queue")

	coins := []string{
		"BTC-USD",
		"ETH-USD",
		"BCH-USD",
		"LTC-USD",
		// "ETC-USD",
	}

	c := Config{
		Channel: ch,
		Queue:   &q,
	}

	var wg sync.WaitGroup
	wg.Add(len(coins))

	for _, coin := range coins {
		log.Printf("Getting Results for %s", coin)
		go func(coin string) {
			get(coin, c, &wg)
		}(coin)
	}
	wg.Wait()
}

func get(coin string, conf Config, group *sync.WaitGroup) error {
	// could this be in the config.yaml?
	url := fmt.Sprintf("https://api.pro.coinbase.com/products/%s/book?level=3", coin)

	for {
		resp, err := http.Get(url)
		if err != nil {
			log.Println("error", err)
			return err
		}

		defer resp.Body.Close()

		b, err := ioutil.ReadAll(resp.Body)
		if err != nil {
			return err
		}

		err = Send(conf, b)
		if err != nil {
			log.Println("error", err)
			return err
		}
	}
}

func failOnError(err error, msg string) {
	if err != nil {
		log.Fatalf("%s: %s", msg, err)
	}
}
