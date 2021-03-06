# Group Project: Deep Order Book

# Demo
In order to view the data you need to run an HTTP server. You will also need to have Python3 installed on your machine.
1. Run the following command from the root of the directory
`python3 -m http.server`
2. Browse to `d3/orderbook.html`
Note: it may take a few seconds for the chart to show.

# Development
If you are starting the project from the first time
`make up-build`

All other times
`make up`

To spin down the project
`make down`

If you get the following error:
`ERROR: Service "rabbit" uses an undefined network "dvadev_default"`

Run this command:
`docker network create dvadev_default`

Creating Storage Claim:
`k apply -f k8s/storage/database-persistent-volume-claim.yaml` (from project root)
OR
`make claim`

Running Kubernetes locally
You can browse to `http://localhost:8001/api/v1/namespaces/kube-system/services/https:kubernetes-dashboard:/proxy/#!/overview?namespace=default` to view the Kubernetes dashboard.
If you get the following error `http://localhost:8001/api/v1/namespaces/kube-system/services/https:kubernetes-dashboard:/proxy/#!/overview?namespace=default` Run the command below
`kubectl apply -f https://raw.githubusercontent.com/kubernetes/dashboard/master/aio/deploy/recommended/kubernetes-dashboard.yaml`

# Config Files
Where config files are used you should see a `config-example.yaml`. When running locally
rename that file to `config.yaml`, then replace values with proper values for given environment
w
# Database
When creating creating the database, the `init.sql` will be ran on inital boot.
Meaning, if you want this to trigger after you have already spun up the project,
you will need to delete eveything in the /db/pgdata folder that would have been created.
NOTE: this will remove all data in the database, so use this with cation.

## Pending Questions
- DB Scheme: what should the tables look like?
- How do we handle migrations?


## Kubernetes Ingress
1: Start Nginx Ingress within the CLuster
	`kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/master/deploy/mandatory.yaml`
2: Enable Ingress
	`kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/master/deploy/provider/cloud-generic.yaml`


## Current Table Scheme
```sql
CREATE TABLE raw_events (
 id serial PRIMARY KEY,
 exchange VARCHAR (10) NOT NULL,
 created_at TIMESTAMP NOT NULL,
 data JSON NOT NULL
);```

## Running Cleaning Script
Example (from project root): 
`python postprocessing/clean_data.py raw_events_2_exchanges_Apr_3rd_2019.csv`
This will write data to the data directory, with `clean_` attached to the original fileanme
_Note: uses python3_