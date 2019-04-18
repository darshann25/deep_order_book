package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/streadway/amqp"

	"github.com/spf13/viper"

	_ "github.com/lib/pq"
)

var (
	configFilePath string
	queueName      string
	dbName         string
	dbUser         string
	dbPassword     string
	dbHost         string
	dbPort         string
	db             *sql.DB
	q              amqp.Queue
	channel        *amqp.Channel
)

// RawEvent struct representing the scheme of the raw_events table
type RawEvent struct {
	ID        int64     `db:"id"`
	Exchange  string    `db:"exchange"`
	CreatedAt time.Time `db:"created_at"`
	Data      []byte    `db:"data"`
}

func init() {
	log.Println("Connecting to Rabbit")
	conn, err := ConnectToRabbit()
	if err != nil {
		log.Println("There was an error connection to rabbit: ", err)
		os.Exit(1)
	}
	channel, err = conn.Channel()
	if err != nil {
		log.Println("Failed to declare Channel: ", err)
		os.Exit(1)
	}

	q, err = channel.QueueDeclare(
		queueName, // name
		false,     // durable
		false,     // delete when usused
		false,     // exclusive
		false,     // no-wait
		nil,       // arguments
	)
	if err != nil {
		log.Println("Failed to declare Queue: ", err)
		os.Exit(1)
	}

	// Rabbit
	queueName = viper.GetString("rabbit.queue_name")

	// Postgres
	dbName = viper.GetString("db.db_name")
	dbUser = viper.GetString("db.user")
	dbPassword = viper.GetString("db.password")
	dbHost = viper.GetString("db.host")
	dbPort = viper.GetString("db.port")

	// TODO: Ping DB, if fail exit

	//host=/cloudsql/dva-1-235201:us-central1:dva-db

	dbinfo := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=disable", dbHost, dbPort, dbUser, dbPassword, dbName)
	// connStr := fmt.Sprintf("postgres://%s:%s@%s/%s?sslmode=disable", dbUser, dbPassword, dbHost, dbName)
	// log.Println("Connection String: ", connStr)

	log.Println("dbinfo: ", dbinfo)

	log.Println("Opening connection to DB")
	db, err = sql.Open("postgres", dbinfo)
	if err != nil {
		fmt.Println("Error connection to DB: ", err)
		os.Exit(1)
	}

	log.Println("Pinging DB")
	err = db.Ping()
	if err != nil {
		log.Println("Could not Ping database...exiting: ", err)
		os.Exit(1)
	}

	log.Println("Init complete.")
}

// WorkerMessage a message coming from a worker
type WorkerMessage struct {
	Exchange string `json:"exchange"`
	Data     []byte `json:"data"`
}

func main() {
	defer db.Close()
	messages, err := channel.Consume(
		queueName, // queue
		"",        // consumer
		true,      // auto-ack
		false,     // exclusive
		false,     // no-local
		false,     // no-wait
		nil,       // args
	)

	if err != nil {
		log.Println("Dailed to register consumer: ", err)
		os.Exit(1)
	}

	for d := range messages {
		insertTime := time.Now()

		var rawData WorkerMessage
		err := json.Unmarshal(d.Body, &rawData)
		if err != nil {
			fmt.Println("JSON Error: ", err)
			continue
		}

		query := `
					INSERT INTO raw_events(exchange, created_at, data)
					VALUES ($1, $2, $3)
					RETURNING id;
				`
		_, err = db.Exec(query, rawData.Exchange, &insertTime, rawData.Data)
		if err != nil {
			fmt.Println("error: ", err)
			continue
		}
	}
}
