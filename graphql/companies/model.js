import { doc } from 'serverless-dynamodb-client'
import _ from 'lodash'

export const queryCompanies = () => (
  new Promise((resolve, reject) => {
    const params = {
      TableName: process.env.DYNAMODB_MEMBERS_TABLE,
      // IndexName: 'CreatedAtIndex',
      // KeyConditionExpression: 'userId = :userId',
      // ExpressionAttributeValues: {
      //   ':userId': userId,
      // },
      // ScanIndexForward: false,
    }

    doc.scan(params, (err, data) => {
      if (err) {
        reject(err)
        return
      }

      const membersWithCompany = data.Items.filter(x => x.employerName)
      const uniqueMembersWithCompany = _.uniqBy(membersWithCompany, 'employerName')
      const membersWithNonGovernmentCompnaies = uniqueMembersWithCompany.filter(x => x.profession !== 'Government')
      const companies = membersWithNonGovernmentCompnaies.map(x => ({
        name: x.employerName,
        city: x.employerCity,
      }))

      resolve(companies)
    })
  })
)

export default {}
