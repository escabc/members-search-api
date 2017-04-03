import fs from 'fs'
import { join } from 'path'
import moment from 'moment'

export const schema = [fs.readFileSync(join(__dirname, 'schema.graphql'), 'utf-8')]

export const resolver = {
  Member: {
    name: root => `${root.firstName} ${root.lastName}`,
    certifications: (root) => {
      const certifications = root.certifications || []
      // remove CESCL certification if it's expired
      if (moment().isAfter(root.cesclExpiryDate)) {
        const index = certifications.indexOf('CESCL')
        certifications.splice(index, 1)
      }

      return certifications
    },

    company: root => ({
      name: root.employerName,
      city: root.employerCity,
    }),

    registeredAt: root => root.registrationDate,
    expiredAt: root => root.dateMembershipExpires,
  },
}
