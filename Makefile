up:
	docker-compose up

up-build:
	docker-compose up --build

down:
	docker-compose down

clean-db:
	rm -rf ./db/pgdata/*

claim:
 	k apply -f k8s/storage/database-persistent-volume-claim.yaml