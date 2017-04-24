import fs from 'fs'
import { join } from 'path'
import { merge } from 'lodash'
import { makeExecutableSchema } from 'graphql-tools'

import { schema as MembersSchema, resolver as MembersResolver } from './members'
import { queryProfessionalMembers, queryCorporateMembers, queryGovernmentMembers } from './members/model'

const rootSchema = [fs.readFileSync(join(__dirname, 'schema.graphql'), 'utf-8')]
const rootResolvers = {
  Query: {
    professionalMembers: async () => {
      const members = await queryProfessionalMembers()

      return members
    },
    corporateMembers: async () => {
      const members = await queryCorporateMembers()

      return members
    },
    governmentMembers: async () => {
      const members = await queryGovernmentMembers()

      return members
    },
  },
}

const schema = [...rootSchema, ...MembersSchema]
const resolvers = merge(rootResolvers, MembersResolver)

const executableSchema = makeExecutableSchema({
  typeDefs: schema,
  resolvers,
})

export default executableSchema
