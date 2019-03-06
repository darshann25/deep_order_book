# Group Project: Deep Order Book

Things & Stuff

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

# Config Files
Where config files are used you should see a `config-example.yaml`. When running locally
rename that file to `config.yaml`, then replace values with proper values for given environment

# Database
When creating creating the database, the `init.sql` will be ran on inital boot.
Meaning, if you want this to trigger after you have already spun up the project,
you will need to delete eveything in the /db/pgdata folder that would have been created.
NOTE: this will remove all data in the database, so use this with cation.

## Pending Questions
- DB Scheme: what should the tables look like?
- How do we handle migrations?
