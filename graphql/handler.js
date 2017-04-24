import dotenv from 'dotenv'
import { graphql } from 'graphql'

import schema from './schema'

dotenv.config()

export const handler = (event, _, callback) => {
  const { query, variables } = event.body
  graphql(schema, query, null, null, variables)
    .then(response => callback(null, response))
    .catch(error => callback(error))
}

export default {}
