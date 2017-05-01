import dotenv from 'dotenv'
import { graphql } from 'graphql'

import schema from './schema'

dotenv.config()

const createResponse = (statusCode, body) => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*', // Required for CORS
    'Access-Control-Allow-Credentials': true, // Required for cookies, authorization headers with HTTPS
  },
  body: JSON.stringify(body),
})

export const handler = (event, _, callback) => {
  const body = JSON.parse(event.body)
  graphql(schema, body.query, null, null, body.variables)
    .then(response => callback(null, createResponse(200, response)))
    .catch(err => callback(null, createResponse(err.responseStatusCode || 500, { message: err.message || 'Internal server error' })))
}

export default {}
