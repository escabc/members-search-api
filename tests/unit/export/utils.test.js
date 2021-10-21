import test from 'ava'

import { findCustomFieldByName } from '../../../export/utils'

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
