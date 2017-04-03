export const findCustomFieldByName = (nodes, name) => {
  const node = nodes.find(x => x.$.FieldCode === name)

  return node ? node.Values[0].Value : null
}

export default {}
