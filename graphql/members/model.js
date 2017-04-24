import { doc } from 'serverless-dynamodb-client'
import _ from 'lodash'

export const queryProfessionalMembers = () => (
  new Promise((resolve, reject) => {
    const params = {
      TableName: process.env.DYNAMODB_MEMBERS_TABLE,
      FilterExpression: 'membership <> :corporate and membership <> :government',
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

      const items = data.Items.filter(x => x.visible)
      const itemsWithDefaultCertifications = items.map(x => ({
        ...x,
        certifications: x.certifications || [],
      }))
      const itemsSortedByName = _.sortBy(itemsWithDefaultCertifications, ['firstName', 'lastName'])

      resolve(itemsSortedByName)
    })
  })
)

export const queryCorporateMembers = () => (
  new Promise((resolve, reject) => {
    const params = {
      TableName: process.env.DYNAMODB_MEMBERS_TABLE,
      FilterExpression: 'membership = :corporate',
      ExpressionAttributeValues: {
        ':corporate': 'Corporate member',
      },
    }

    doc.scan(params, (err, data) => {
      if (err) {
        reject(err)
        return
      }

      const items = data.Items
      const itemsSortedByName = _.sortBy(items, 'employerName')

      resolve(itemsSortedByName)
    })
  })
)

export const queryGovernmentMembers = () => (
  new Promise((resolve, reject) => {
    const params = {
      TableName: process.env.DYNAMODB_MEMBERS_TABLE,
      FilterExpression: 'membership = :government',
      ExpressionAttributeValues: {
        ':government': 'Government Agency',
      },
    }

    doc.scan(params, (err, data) => {
      if (err) {
        reject(err)
        return
      }

      const items = data.Items
      const itemsSortedByName = _.sortBy(items, 'employerName')

      resolve(itemsSortedByName)
    })
  })
)

export const queryMembersByCompany = (company) => (
  new Promise((resolve, reject) => {
    const params = {
      TableName: process.env.DYNAMODB_MEMBERS_TABLE,
      FilterExpression: 'employerName = :company',
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
