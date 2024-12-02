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

## Pre-deploy/Pre-packaging
We're using [serverless-webpack](https://github.com/serverless-heaven/serverless-webpack) to package the functions for deployments and [serverless-copy-webpack-plugin](https://www.npmjs.com/package/serverless-copy-webpack-plugin) to copy over non-js files for packaging. `serverless-webpack` will compile all the javascript into a single file (per function), so the `graphql/members/members-schema.graphql` file needs to be copied to `graphql/members-schema.graphql` before packaging and deployment. Do this by running `yarn run copy:members-schema` before the deploy for packaging scrips.

## Packaging
Run `yarn run package` to create the compiled packages locally without deploying to AWS.

## Deploy
Deploy to AWS Lambda for testing:
```sh
$> yarn run deploy
```

When it's completed you'll see this:
```
endpoints:
  POST - https://[somehash].execute-api.us-west-2.amazonaws.com/development/export
  POST - https://[somehash].execute-api.us-west-2.amazonaws.com/development/graphql
```

Use the `graphql` endpoint for testing in Postman

Deploy to live AWS Lambda:
```sh
$> yarn run deploy:production
```