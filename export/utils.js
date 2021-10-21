export const findCustomFieldByName = (fields, name) => {
  const field = fields.find(obj => obj.CustomFieldValue.FieldCode === name);

  return field ? field.CustomFieldValue.Values[0].Value : null;
}

export default {}
