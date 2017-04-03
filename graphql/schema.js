import fs from 'fs'
import { join } from 'path'
import { merge } from 'lodash'
import { makeExecutableSchema } from 'graphql-tools'

import { schema as MembersSchema, resolver as MembersResolver } from './members'
import { schema as CompaniesSchema, resolver as CompaniesResolver } from './companies'
import { queryMembers } from './members/model'
import { queryCompanies } from './companies/model'

const rootSchema = [fs.readFileSync(join(__dirname, 'schema.graphql'), 'utf-8')]
const rootResolvers = {
  Query: {
    members: async () => {
      const members = await queryMembers()

      return members
    },
    companies: async () => {
      const companies = await queryCompanies()

      return companies
    },
  },
}

const schema = [...rootSchema, ...MembersSchema, ...CompaniesSchema]
const resolvers = merge(rootResolvers, MembersResolver, CompaniesResolver)

const executableSchema = makeExecutableSchema({
  typeDefs: schema,
  resolvers,
})

export default executableSchema
