import fs from 'fs'
import { join } from 'path'
import moment from 'moment'

import { queryMembersByCompany } from './model'

export const schema = [fs.readFileSync(join(__dirname, 'schema.graphql'), 'utf-8')]
export const resolver = {
  ProfessionalMember: {
    name: root => `${root.firstName} ${root.lastName}`,
    title: root => root.professionalTitle,
    email: root => root.email,
    phone: root => (root.employerPhoneAreaCode && root.employerPhone ? `${root.employerPhoneAreaCode} ${root.employerPhone}` : null),
    company: root => root.employerName,
    regions: root => root.regions,
    location: root => ({
      address: root.employerAddressLine1,
      city: root.employerCity,
      province: root.employerStateAbbrev,
      country: root.employerCountry,
      postalCode: root.employerPostalCode,
    }),
    certifications: (root) => {
      const CESCL = root.certifications.includes('CESCL')
      const CESCLExpired = root.cesclExpiryDate ? moment().isAfter(root.cesclExpiryDate) : null
      const CPESC = root.certifications.includes('CPESC')
      const CISEC = root.certifications.includes('CISEC')

      return { CESCL, CESCLExpired, CPESC, CISEC }
    },

    registeredAt: root => root.registrationDate,
    expired: root => moment().isAfter(root.dateMembershipExpires),
  },

  CorporateMember: {
    name: root => root.employerName,
    specialities: root => root.specialities,
    website: root => root.employerWebsite,
    email: root => root.email,
    phone: root => (root.employerPhoneAreaCode && root.employerPhone ? `${root.employerPhoneAreaCode} ${root.employerPhone}` : null),
    fax: root => (root.employerFaxAreaCode && root.employerFax ? `${root.employerFaxAreaCode} ${root.employerFax}` : null),
    description: root => root.morePersonalInfo,
    regions: root => root.regions,
    location: root => ({
      address: root.employerAddressLine1,
      city: root.employerCity,
      province: root.employerStateAbbrev,
      country: root.employerCountry,
      postalCode: root.employerPostalCode,
    }),
    totals: async (root) => {
      const members = await queryMembersByCompany(root.employerName)
      const totals = {
        CESCL: members.filter(x => x.certifications && x.certifications.includes('CESCL')).length,
        CPESC: members.filter(x => x.certifications && x.certifications.includes('CPESC')).length,
        CISEC: members.filter(x => x.certifications && x.certifications.includes('CISEC')).length,
      }

      return totals
    },

    registeredAt: root => root.registrationDate,
    expired: root => moment().isAfter(root.dateMembershipExpires),
  },

  GovernmentMember: {
    name: root => root.employerName,
    description: root => root.morePersonalInfo,
    regions: root => root.regions,
    location: root => ({
      address: root.employerAddressLine1,
      city: root.employerCity,
      province: root.employerStateAbbrev,
      country: root.employerCountry,
      postalCode: root.employerPostalCode,
    }),

    registeredAt: root => root.registrationDate,
    expired: root => moment().isAfter(root.dateMembershipExpires),
  },
}
