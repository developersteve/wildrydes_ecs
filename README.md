# This is a work in progress (so stay tuned) 

TBA all the things in here 

... until then 
## Pre-req
- Docker (of course) 
- An AWS account (who doesnt have one of those these days?) 
- An Internet connection (+1 if you have a dial up sound) 

### Set Env Vars 

These environmental variables need to be set (either locally or with the container) so the app can access them. 

**Note:** This app uses [AWS SDK v3](https://github.com/aws/aws-sdk-js-v3) so has the superpower to use specific environmental vars 

#### AWS DynamoDB connection creds

These need to be set and an IAM user defined with access to a DynamoDB instance, also set your DynamoDB region here too. 

```
AWS_ACCESS_KEY_ID 
AWS_SECRET_ACCESS_KEY 
AWS_REGION
```

#### Lumigo Tracer Token and Service Name

This application uses the [Lumigo NodeJS distro](https://github.com/lumigo-io/opentelemetry-js-distro) to trace the base application. 

The `LUMIGO_TRACER_TOKEN` value is the Lumigo Token available from your Lumigo account, see the [docs for more](https://docs.lumigo.io/docs/lumigo-tokens) info on how to find it.

```
LUMIGO_TRACER_TOKEN
OTEL_SERVICE_NAME
```

For more on observing containerized applications see the [Lumigo help docs](https://docs.lumigo.io/docs/containerized-applications) 


## Starting the app 

#### locally

From the directory root 

```
node app/index.js
```

Then navigate to http://0.0.0.0 (or http://localhost) in a browser 

#### Docker

With docker running and installed you need to run: 

```
docker build -t wildrydes .
```

Then once the build is finished, run the following and make sure to include your specific environmental variable values: 

```
docker run -d -p 80:80 \ 
-e AWS_ACCESS_KEY_ID= \
-e AWS_SECRET_ACCESS_KEY= \
-e AWS_REGION= \
-e LUMIGO_TRACER_TOKEN= \
-e OTEL_SERVICE_NAME=wildrydes_ecs \
wildrydes 
```

#### AWS

Using cloudfomation (TBA)