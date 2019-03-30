up:
	docker-compose up

up-build:
	docker-compose up --build

down:
	docker-compose down

clean-db:
	rm -rf ./db/pgdata/*

token:
	kubectl -n kube-system describe secret $(kubectl -n kube-system get secret | grep admin-user | awk '{print $1}')

# claim:
#  	k apply -f k8s/storage/database-persistent-volume-claim.yaml