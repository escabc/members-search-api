import { doc } from 'serverless-dynamodb-client'
import _ from 'lodash'
import moment from 'moment'

const excludeExpiredOver30Days = items => {
  return items.filter(item => {
    const expiry = moment(item.DateMembershipExpires)
    const today = moment()
    return expiry.diff(today, 'days') > -31
  })
}

export const queryProfessionalMembers = () => (
  new Promise((resolve, reject) => {
    const params = {
      TableName: process.env.DYNAMODB_MEMBERS_TABLE,
      FilterExpression: 'Membership <> :corporate and Membership <> :government',
      ExpressionAttributeValues: {
        ':corporate': 'Corporate member',
        ':government': 'Government Agency',
      },
    }

    doc.scan(params, (err, data) => {
      if (err) {
        reject(err)
        return
      }

      const items = excludeExpiredOver30Days(data.Items.filter(x => x.visible))
      const itemsWithDefaultCertifications = items.map(x => ({
        ...x,
        certifications: x.certifications || [],
      }))
      const itemsSortedByName = _.sortBy(itemsWithDefaultCertifications, ['FirstName', 'LastName'])

      resolve(itemsSortedByName)
    })
  })
)

export const queryCorporateMembers = () => (
  new Promise((resolve, reject) => {
    const params = {
      TableName: process.env.DYNAMODB_MEMBERS_TABLE,
      FilterExpression: 'Membership = :corporate',
      ExpressionAttributeValues: {
        ':corporate': 'Corporate member',
      },
    }

    doc.scan(params, (err, data) => {
      if (err) {
        reject(err)
        return
      }

      const items = excludeExpiredOver30Days(data.Items)
      const itemsSortedByName = _.sortBy(items, 'EmployerName')

      resolve(itemsSortedByName)
    })
  })
)

export const queryGovernmentMembers = () => (
  new Promise((resolve, reject) => {
    const params = {
      TableName: process.env.DYNAMODB_MEMBERS_TABLE,
      FilterExpression: 'Membership = :government',
      ExpressionAttributeValues: {
        ':government': 'Government Agency',
      },
    }

    doc.scan(params, (err, data) => {
      if (err) {
        reject(err)
        return
      }

      const items = excludeExpiredOver30Days(data.Items)
      const itemsSortedByName = _.sortBy(items, 'EmployerName')

      resolve(itemsSortedByName)
    })
  })
)

export const queryMembersByCompany = company => (
  new Promise((resolve, reject) => {
    const params = {
      TableName: process.env.DYNAMODB_MEMBERS_TABLE,
      FilterExpression: 'EmployerName = :company',
      ExpressionAttributeValues: {
        ':company': company,
      },
    }

    doc.scan(params, (err, data) => {
      if (err) {
        reject(err)
        return
      }

      resolve(data.Items)
    })
  })
)

export default {}
