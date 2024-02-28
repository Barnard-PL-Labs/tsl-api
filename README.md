# TSL API on Google Cloud Run

This folder has everything you need to deploy TSL as an API.

This is based on the [system packages tutorial](https://cloud.google.com/run/docs/tutorials/system-packages).
For more details on how to work with this read the [Google Cloud Run Node.js Samples README](https://github.com/GoogleCloudPlatform/nodejs-docs-samples/tree/main/run).

The basic idea is that the dockerfile is setup to pull the latest version of tsltools (eventually would be nice to have releases rather than just building from the git repo), then upload the resulting docker image to google cloud, where it can be accessed as an api.

# steps

Follow the directions here: https://cloud.google.com/run/docs/tutorials/system-packages#handling_incoming_requests

To test locally

```
   docker build -t tsl/api .  #use --no-cache to ensure a fresh build
   docker run -d -p 8080:8080 tsl/api
```

then go to localhost:8080. note that this only works with port 8080

to deploy

```
   docker build -t tsl/api . 
   gcloud builds submit --tag gcr.io/tslapi-2/tsl --timeout=1h
   gcloud run deploy graphviz-web --image gcr.io/tslapi-2/tsl
```

you need to set a longer time out since it takes so long to build (30 min maybe?).

no idea why it is still called graphviz-web...


## Dependencies

* **express**: Web server framework.
* **mocha**: [development] Test running framework.
* **supertest**: [development] HTTP assertion test client.
