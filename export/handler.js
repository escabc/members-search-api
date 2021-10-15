import dotenv from 'dotenv'
import fetch from 'node-fetch'
import xml2js from 'xml2js'
import parse from 'csv-parse'
import { doc } from 'serverless-dynamodb-client'
import _ from 'lodash'
import camelcase from 'camelcase-keys'

import { findCustomFieldByName } from './utils'

dotenv.config()

const parseString = (input, options) => (
  new Promise((resolve, reject) => {
    xml2js.parseString(input, options, (err, result) => {
      if (err) {
        reject(err)
      } else {
        resolve(result)
      }
    })
  })
)

const parseResponse = async res => {
  const xml = await res.text()
  const json = await parseString(xml)

  return json.YourMembership_Response
}

const api = async (method, props) => {
  const builder = new xml2js.Builder()
  const xml = builder.buildObject(props)
  const res = await fetch('https://api.yourmembership.com', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `
      <?xml version="1.0" encoding="utf-8" ?>
      <YourMembership>
        <Version>2.25</Version>
        <ApiKey>${process.env.YM_PRIVATE_API_KEY}</ApiKey>
        <CallID>001</CallID>
        <SaPasscode>${process.env.YM_SA_PASSCODE}</SaPasscode>
        <Call Method="${method}">${xml}</Call>
      </YourMembership>
    `,
  })

  const root = await parseResponse(res)
  const node = root[method][0]

  return node
}

const exportMembers = async () => {
  const res = await api('Sa.Export.Members', { Unicode: 0, CustomFields: 1 })
  const exportId = res.ExportID[0]

  return exportId
}

const waitForSuccessfulExport = exportId => {
  const retries = 5
  const delay = 1000

  return new Promise((resolve, reject) => {
    const func = async n => {
      const res = await api('Sa.Export.Status', { ExportID: exportId })
      if (res.Status[0] === '2' && n < 0) {
        const exportUri = res.ExportURI[0]
        resolve(exportUri)
      } else if (n >= 0) {
        setTimeout(() => func(n - 1), delay)
      } else {
        reject()
      }
    }
    func(retries)
  })
}

const transformItem = async item => {
  // parse custom fields
  const itemWithMergedCustomFields = item

  const xml = await parseString(item.CustomFields)
  if (xml) {
    const node = xml.CustomFieldResponses.CustomFieldResponse
    if (node) {
      const nodesWithValue = node.filter(x => _.compact(x.Values).length)
      itemWithMergedCustomFields.certifications = findCustomFieldByName(nodesWithValue, 'Accreditation')
      itemWithMergedCustomFields.specialities = findCustomFieldByName(nodesWithValue, 'CorpSpecialty') || []
      itemWithMergedCustomFields.regions = findCustomFieldByName(nodesWithValue, 'RegionInfo') || []
      itemWithMergedCustomFields.visible = true
      if (findCustomFieldByName(nodesWithValue, 'searchexclusion')) {
        itemWithMergedCustomFields.visible = findCustomFieldByName(nodesWithValue, 'searchexclusion')[0] === 'NO'
      }
      if (findCustomFieldByName(nodesWithValue, 'CESCLExpiryDate')) {
        itemWithMergedCustomFields.cesclExpiryDate = findCustomFieldByName(nodesWithValue, 'CESCLExpiryDate')[0]
      }
      if (findCustomFieldByName(nodesWithValue, 'ProfessionalEmail')) {
        itemWithMergedCustomFields.email = findCustomFieldByName(nodesWithValue, 'ProfessionalEmail')[0]
      }
      if (findCustomFieldByName(nodesWithValue, 'CorplogoURL')) {
        itemWithMergedCustomFields.avatar = findCustomFieldByName(nodesWithValue, 'CorplogoURL')[0]
      }
      if (findCustomFieldByName(nodesWithValue, 'PCG')) {
        itemWithMergedCustomFields.contactName = findCustomFieldByName(nodesWithValue, 'PCG')[0]
      }
      if (findCustomFieldByName(nodesWithValue, 'BUS')) {
        itemWithMergedCustomFields.contactDepartment = findCustomFieldByName(nodesWithValue, 'BUS')[0]
      }
      if (findCustomFieldByName(nodesWithValue, 'GovtContactPhone')) {
        itemWithMergedCustomFields.contactPhone = findCustomFieldByName(nodesWithValue, 'GovtContactPhone')[0]
      }
      if (findCustomFieldByName(nodesWithValue, 'GovtContactEmail')) {
        itemWithMergedCustomFields.contactEmail = findCustomFieldByName(nodesWithValue, 'GovtContactEmail')[0]
      }
      if (findCustomFieldByName(nodesWithValue, 'weblink')) {
        itemWithMergedCustomFields.programWebsite = findCustomFieldByName(nodesWithValue, 'weblink')[0]
      }
      if (findCustomFieldByName(nodesWithValue, 'Rainfalllink')) {
        itemWithMergedCustomFields.programRainfallLink = findCustomFieldByName(nodesWithValue, 'Rainfalllink')[0]
      }
      if (findCustomFieldByName(nodesWithValue, 'CorpContact')) {
        itemWithMergedCustomFields.corporateContactName = findCustomFieldByName(nodesWithValue, 'CorpContact')[0]
      }
    }
  }
  delete itemWithMergedCustomFields.CustomFields

  const itemWithId = { id: item.Web_Site_Member_ID, ...itemWithMergedCustomFields }
  const itemWithoutEmptyProperties = _.omitBy(itemWithId, x => (
    _.isNil(x) || (_.isString(x) && _.isEmpty(x))
  ))
  const itemWithCamelcase = camelcase(itemWithoutEmptyProperties)

  return itemWithCamelcase
}

const batchUpdate = items => (
  new Promise(async (resolve, reject) => {
    const promises = items.map(x => transformItem(x))
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

const createTable = data => (
  new Promise(async resolve => {
    const MAX_BATCH_SIZE = 25
    const splits = []
    while (data.length > 0) {
      splits.push(data.splice(0, MAX_BATCH_SIZE))
    }

    const promises = splits.map(x => batchUpdate(x))
    await Promise.all(promises)

    resolve()
  })
)

const importToDatabase = uri => (
  new Promise(async (resolve, reject) => {
    // TODO: convert to stream
    // TODO: sometimes fetch is returning 404
    const response = await fetch(uri)
    const csv = await response.text()
    const columns = ['Web_Site_Member_ID', 'Master_Member_ID', 'API_GUID', 'Constituent_ID', 'Registration_Date', 'Approved_Site_Member', 'Date_Approved', 'Date_Last_Login', 'Member_Suspended', 'Last_Updated', 'Date_Membership_Expires', 'Membership', 'Has_Donated_Online', 'Date_Last_Donated', 'Has_Purchased_Online', 'Date_Last_Purchased', 'Has_Registered_Event_Online', 'Date_Last_Event_Reg', 'Username', 'Password', 'Member_Type_Code', 'Primary_Group_Code', 'Gender', 'First_Name', 'Middle_Name', 'Last_Name', 'Nickname', 'Member_Name_Suffix', 'Member_Name_Title', 'Birthdate', 'Marriage_Status', 'Maiden_Name', 'Anniversary_Date', 'Spouse_Name', 'Email_Address', 'Email_Address_Alternate', 'Email_Bounced', 'Messenger_Type', 'Messenger_Handle', 'Home_Address_Line1', 'Home_Address_Line2', 'Home_City', 'Home_Location', 'Home_State_Abbrev', 'Home_Postal_Code', 'Home_Country', 'Personal_Website', 'Home_Phone_Area_Code', 'Home_Phone', 'Mobile_Area_Code', 'Mobile', 'Employer_Name', 'Professional_Title', 'Profession', 'Employer_Address_Line1', 'Employer_Address_Line2', 'Employer_City', 'Employer_Location', 'Employer_State_Abbrev', 'Employer_Postal_Code', 'Employer_Country', 'Employer_Website', 'Employer_Phone_Area_Code', 'Employer_Phone', 'Employer_Fax_Area_Code', 'Employer_Fax', 'Resume_Exists', 'Resume_Headline', 'Social_Organizations', 'Education_and_Experience', 'More_Personal_Info', 'Internal_Comments', 'Home_Address_Validated', 'Employer_Address_Validated', 'Date_Last_Renewed', 'Date_Effective_Membership_Expires', 'Import_Batch_ID', 'Career_Openings_Allowed', 'Members_Pages_Allowed', 'Additional_Seats_Allowed', 'intNameFormatNormal', 'Member_Has_Consented', 'Date_Consented', 'Consent_IP_Address', 'Member_Has_Revoked_Consent', 'Date_Consent_Revoked', 'CustomFields']
    parse(csv, { columns: () => columns }, async (err, data) => {
      if (err) {
        reject(err)
      } else {
        await clearTable()
        await createTable(data)

        resolve()
      }
    })
  })
)

const members = async () => {
  const exportId = await exportMembers()
  const exportUri = await waitForSuccessfulExport(exportId)
  await importToDatabase(exportUri)
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
