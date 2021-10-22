import dotenv from 'dotenv'
import fetch from 'node-fetch'
import { doc } from 'serverless-dynamodb-client'
import _ from 'lodash'

import { findCustomFieldByName } from './utils'

dotenv.config()


/**
 * Sets the custom fields as top level items.
 * @param {*} item 
 * @returns 
 */
const setCustomFields = async item => {
  // parse custom fields
  const itemWithMergedCustomFields = item
  const fields = item.CustomFields;

  if (fields) {
    const fieldsWithValue = fields.filter(field => _.compact(field.Values).length)
    itemWithMergedCustomFields.certifications = findCustomFieldByName(fieldsWithValue, 'Accreditation')
    itemWithMergedCustomFields.specialities = findCustomFieldByName(fieldsWithValue, 'CorpSpecialty') || []
    itemWithMergedCustomFields.regions = findCustomFieldByName(fieldsWithValue, 'RegionInfo') || []
    itemWithMergedCustomFields.visible = true
    if (findCustomFieldByName(fieldsWithValue, 'searchexclusion')) {
      itemWithMergedCustomFields.visible = findCustomFieldByName(fieldsWithValue, 'searchexclusion')[0] === 'NO'
    }
    if (findCustomFieldByName(fieldsWithValue, 'CESCLExpiryDate')) {
      itemWithMergedCustomFields.cesclExpiryDate = findCustomFieldByName(fieldsWithValue, 'CESCLExpiryDate')[0]
    }
    if (findCustomFieldByName(fieldsWithValue, 'ProfessionalEmail')) {
      itemWithMergedCustomFields.email = findCustomFieldByName(fieldsWithValue, 'ProfessionalEmail')[0]
    }
    if (findCustomFieldByName(fieldsWithValue, 'CorplogoURL')) {
      itemWithMergedCustomFields.avatar = findCustomFieldByName(fieldsWithValue, 'CorplogoURL')[0]
    }
    if (findCustomFieldByName(fieldsWithValue, 'PCG')) {
      itemWithMergedCustomFields.contactName = findCustomFieldByName(fieldsWithValue, 'PCG')[0]
    }
    if (findCustomFieldByName(fieldsWithValue, 'BUS')) {
      itemWithMergedCustomFields.contactDepartment = findCustomFieldByName(fieldsWithValue, 'BUS')[0]
    }
    if (findCustomFieldByName(fieldsWithValue, 'GovtContactPhone')) {
      itemWithMergedCustomFields.contactPhone = findCustomFieldByName(fieldsWithValue, 'GovtContactPhone')[0]
    }
    if (findCustomFieldByName(fieldsWithValue, 'GovtContactEmail')) {
      itemWithMergedCustomFields.contactEmail = findCustomFieldByName(fieldsWithValue, 'GovtContactEmail')[0]
    }
    if (findCustomFieldByName(fieldsWithValue, 'weblink')) {
      itemWithMergedCustomFields.programWebsite = findCustomFieldByName(fieldsWithValue, 'weblink')[0]
    }
    if (findCustomFieldByName(fieldsWithValue, 'Rainfalllink')) {
      itemWithMergedCustomFields.programRainfallLink = findCustomFieldByName(fieldsWithValue, 'Rainfalllink')[0]
    }
    if (findCustomFieldByName(fieldsWithValue, 'CorpContact')) {
      itemWithMergedCustomFields.corporateContactName = findCustomFieldByName(fieldsWithValue, 'CorpContact')[0]
    }
  }

  delete itemWithMergedCustomFields.CustomFields

  const itemWithId = { id: item.WebSiteMemberID, ...itemWithMergedCustomFields }
  const itemWithoutEmptyProperties = _.omitBy(itemWithId, x => (
    _.isNil(x) || (_.isString(x) && _.isEmpty(x))
  ))

  return itemWithoutEmptyProperties
}

/**
 * Write to DynamoDB
 * @param {Array} items 
 * @returns 
 */
const batchUpdateNew = items => (
  new Promise(async (resolve, reject) => {
    const promises = items.map(x => setCustomFields(x))
    const transformedItems = await Promise.all(promises)
    const params = {
      RequestItems: {
        [process.env.DYNAMODB_MEMBERS_TABLE]: transformedItems.map(x => ({
          PutRequest: { Item: { ...x } },
        })),
      },
    }
    doc.batchWrite(params, err => {
      if (err) {
        reject(err)
      } else {
        resolve()
      }
    })
  })
)

const batchDelete = items => (
  new Promise(async (resolve, reject) => {
    const params = {
      RequestItems: {
        [process.env.DYNAMODB_MEMBERS_TABLE]: items.map(x => ({
          DeleteRequest: { Key: { id: x.id } },
        })),
      },
    }
    doc.batchWrite(params, err => {
      if (err) {
        reject(err)
      } else {
        resolve()
      }
    })
  })
)

const queryMembers = () => (
  new Promise((resolve, reject) => {
    const params = {
      TableName: process.env.DYNAMODB_MEMBERS_TABLE,
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

const clearTable = () => (
  new Promise(async resolve => {
    const MAX_BATCH_SIZE = 25
    const splits = []
    const data = await queryMembers()
    while (data.length > 0) {
      splits.push(data.splice(0, MAX_BATCH_SIZE))
    }

    const promises = splits.map(x => batchDelete(x))
    await Promise.all(promises)

    resolve()
  })
)

export const createTable = data => (
  new Promise(async resolve => {
    const MAX_BATCH_SIZE = 25
    const splits = []
    while (data.length > 0) {
      splits.push(data.splice(0, MAX_BATCH_SIZE))
    }

    // const promises = splits.map(x => batchUpdate(x))
    const promises = splits.map(x => batchUpdateNew(x))
    await Promise.all(promises)

    resolve()
  })
)

/**
 * Populates DynamoDB with data
 * @param {JSON} data 
 */
const populateDatabase = async data => {
  await clearTable()
  await createTable(data.MembersProfilesList)
};

/**
 * Retrieve Members from Your Membership REST API 
 * @returns Object
 */
export const getMembers = async () => {
  const res = await fetch('https://ws.yourmembership.com/ams/authenticate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      "UserType": "Admin",
      "ClientID": process.env.CLIENT_ID,
      "Username": process.env.API_KEY,
      "Password": process.env.API_PASSWORD
    })
  })
  .then(response => response.json())
  .then(data => {
    return fetch(`https://ws.yourmembership.com/ams/${data.ClientID}/MembersProfiles?IncludeCustomFields=true`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-ss-id': data.SessionId
      }
    })
    .then(response => response.json());
  })

  return res;
}

const members = async () => {
  const allMembers = await getMembers();
  await populateDatabase(allMembers);
}

export const handler = async (event, context, callback) => {
  try {
    await members()

    callback(null, {})
  } catch (err) {
    callback(err)
  }
}

export default {}
