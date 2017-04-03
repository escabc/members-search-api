import { doc } from 'serverless-dynamodb-client'

export const queryMembers = () => (
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

      resolve(data.Items)
    })
  })
)

export default {}
