# Members Search API

API service for Members Search.

## Setup

### Configuration

Rename `.env.default` to `.env` and replace with real values.

### Install

Install project dependencies:
```sh
$> yarn install
```

Install DynamoDB local and run in as a separate process:
```sh
$> yarn run db:install
$> yarn run db:start
```

Start project in development mode:
```sh
$> yarn start
```

Populate local database:
Generate a POST request to the `export` endpoint using [Postman](https://www.getpostman.com/) or some other API testing service.

### Testing
```sh
$> yarn run test:lint # linting tests
$> yarn run test:unit # unit tests
```

## Deploy

Deploy to AWS Lambda for testing:
```sh
$> yarn run deploy
```
