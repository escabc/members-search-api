import fs from 'fs-extra'
import { join } from 'path'
import moment from 'moment'

import { queryMembersByCompany } from './model'

export const schema = [fs.readFileSync(join(__dirname, 'members-schema.graphql'), 'utf-8')]
export const resolver = {
  ProfessionalMember: {
    name: root => `${root.FirstName} ${root.LastName}`,
    title: root => root.ProfessionalTitle,
    email: root => root.email,
<<<<<<< HEAD
    website: root => root.EmployerWebsite,
    phone: root => (root.EmployerPhoneAreaCode && root.EmployerPhone ? `${root.EmployerPhoneAreaCode} ${root.EmployerPhone}` : null),
    mobile: root => (root.MobileAreaCode && root.MobilePhone ? `${root.MobileAreaCode} ${root.MobilePhone}` : null),
    fax: root => (root.EmployerFaxAreaCode && root.EmployerFax ? `${root.EmployerFaxAreaCode} ${root.EmployerFax}` : null),
    company: root => root.EmployerName,
=======
    website: root => root.employerWebsite,
    phone: root => (root.employerPhoneAreaCode && root.employerPhone ? `${root.employerPhoneAreaCode} ${root.employerPhone}` : null),
    mobile: root => (root.mobileAreaCode && root.mobile ? `${root.mobileAreaCode} ${root.mobile}` : null),
    fax: root => (root.employerFaxAreaCode && root.employerFax ? `${root.employerFaxAreaCode} ${root.employerFax}` : null),
    company: root => root.employerName,
>>>>>>> 22feb09df50ea9853720c956d2c9454d15299284
    regions: root => root.regions,
    location: root => ({
      address: root.EmployerAddressLine1,
      city: root.EmployerCity,
      province: root.EmployerStateAbbrev,
      country: root.EmployerCountry,
      postalCode: root.EmployerPostalCode,
    }),
    certifications: root => {
      const CESCL = root.certifications.includes('CESCL')
      const CESCLExpired = root.cesclExpiryDate ? moment().isAfter(root.cesclExpiryDate) : null
      const CPESC = root.certifications.includes('CPESC')
      const CISEC = root.certifications.includes('CISEC')

      return {
        CESCL, CESCLExpired, CPESC, CISEC,
      }
    },

    registeredAt: root => root.RegistrationDate,
    expired: root => moment().isAfter(root.DateMembershipExpires),
  },

  CorporateMember: {
    name: root => root.EmployerName,
    description: root => root.MorePersonalInfo,
    email: root => root.email,
    phone: root => (root.EmployerPhoneAreaCode && root.EmployerPhone ? `${root.EmployerPhoneAreaCode} ${root.EmployerPhone}` : null),
    fax: root => (root.EmployerFaxAreaCode && root.EmployerFax ? `${root.EmployerFaxAreaCode} ${root.EmployerFax}` : null),
    website: root => root.EmployerWebsite,
    specialities: root => root.specialities,
    regions: root => root.regions,
    location: root => ({
      address: root.EmployerAddressLine1,
      city: root.EmployerCity,
      province: root.EmployerStateAbbrev,
      country: root.EmployerCountry,
      postalCode: root.EmployerPostalCode,
    }),
    contact: root => root.corporateContactName,
    totals: async root => {
      const members = await queryMembersByCompany(root.EmployerName)
      const totals = {
        CESCL: members.filter(x => x.certifications && x.certifications.includes('CESCL')).length,
        CPESC: members.filter(x => x.certifications && x.certifications.includes('CPESC')).length,
        CISEC: members.filter(x => x.certifications && x.certifications.includes('CISEC')).length,
      }

      return totals
    },

    registeredAt: root => root.RegistrationDate,
    expired: root => moment().isAfter(root.DateMembershipExpires),
  },

  GovernmentMember: {
    name: root => root.EmployerName,
    description: root => root.MorePersonalInfo,
    email: root => root.email,
    phone: root => (root.EmployerPhoneAreaCode && root.EmployerPhone ? `${root.EmployerPhoneAreaCode} ${root.EmployerPhone}` : null),
    fax: root => (root.EmployerFaxAreaCode && root.EmployerFax ? `${root.EmployerFaxAreaCode} ${root.EmployerFax}` : null),
    website: root => root.EmployerWebsite,
    regions: root => root.regions,
    location: root => ({
      address: root.EmployerAddressLine1,
      city: root.EmployerCity,
      province: root.EmployerStateAbbrev,
      country: root.EmployerCountry,
      postalCode: root.EmployerPostalCode,
    }),
    contact: root => ({
      name: root.contactName,
      department: root.contactDepartment,
      phone: root.contactPhone,
      email: root.contactEmail,
    }),
    program: root => ({
      website: root.programWebsite,
      rainfallLink: root.programRainfallLink,
    }),

    registeredAt: root => root.RegistrationDate,
    expired: root => moment().isAfter(root.DateMembershipExpires),
  },
}
