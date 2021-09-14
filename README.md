# thebetabase3

TODO for this README:
add section for docker run command
add section on adding fields and api points:
* sequelize process
* express
* anything else?

TODO (matt) figure out deployment of back dev/stage (will probably just use heroku).

TODO (matt) write a few cypress tests

TODO integrated gihtub actions for stage deployment, run cypress on MR/deploy etc

## Running in the Docker

Build docker container run:

`./docker/build.sh`

Run docker container:

`./docker/run.sh`

Remove docker container:

`./docker/remove.sh`


## Deploying to Heroku

https://devcenter.heroku.com/articles/container-registry-and-runtime#pushing-an-existing-image

`docker tag <IMAGE> registry.heroku.com/<APP>/web`

`docker push registry.heroku.com/<APP>/web`

`heroku container:release web`
