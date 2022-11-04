# Smile Identity server to server Demo

This project shows how to do a verification using the server to server javascript library.
We use the [WebComponent javascript sdk](https://docs.smileidentity.com/web-mobile-web/javascript-sdk-beta) to get both the selfies
and the id card image.

The images are then sent to the [server.js](server.js) where we build the payload for the verification.
We then submit the payload to the submit_job method provided by [WebApi](../../src/web-api.js)

This is supplied as a starter project

## How to run the app

1. Install dependencies

```shell
npm install
```

2. Start the server

```shell
npm start
```

3. The app will run on the default port localhost:4000
