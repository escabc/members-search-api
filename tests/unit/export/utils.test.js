import test from 'ava'

import { findCustomFieldByName } from '../../../export/utils'

test('findCustomFieldByName: should find custom field value by field code', (t) => {
  const nodes = [
    { $: { FieldCode: 'Accreditation' }, Values: [{ Value: 'CESCL' }] },
  ]
  t.is(findCustomFieldByName(nodes, 'Accreditation'), 'CESCL', 'should find custom field value')
  t.is(findCustomFieldByName(nodes, 'Something'), null, 'should return null if custom field is not found')
})
