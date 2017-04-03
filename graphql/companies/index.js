import fs from 'fs'
import { join } from 'path'

export const schema = [fs.readFileSync(join(__dirname, 'schema.graphql'), 'utf-8')]

export const resolver = {}
