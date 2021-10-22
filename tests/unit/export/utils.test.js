import test from 'ava'

import { findCustomFieldByName } from '../../../export/utils'
import { getMembers } from '../../../export/handler'

test('getMembers: YM API returns non empty JSON', async (t) => {
   const res = await getMembers();
   t.is(res.ClientID, 78913, 'response should be non empty')
})

test('findCustomFieldByName: should find custom field value by field code', (t) => {
  const customFields = [
    {
       "ExportLabel":"Accreditation",
       "CustomFieldValue":{
          "FieldCode":"Accreditation",
          "Visibility":"",
          "VisibilityInt":2,
          "Values":[
             {
                "Value":"CESCL"
             }
          ],
          "ValuesProxy":[
             {
                "Value":"CESCL"
             }
          ],
          "ClientID":78913
       }
    }
 ];
  t.is(findCustomFieldByName(customFields, 'Accreditation'), 'CESCL', 'should find custom field value')
  t.is(findCustomFieldByName(customFields, 'Something'), null, 'should return null if custom field is not found')
})
