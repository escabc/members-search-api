/**
 * Finds the values of a specific custom field and returns an array
 * of values if it exists.
 * @param {Object} fields 
 * @param {String} name 
 * @returns 
 */
export const findCustomFieldByName = (fields, name) => {
  const field = fields.find(obj => obj.CustomFieldValue.FieldCode === name);

  return field ? field.CustomFieldValue.Values.map(val => val.Value) : null;
}

export default {}
