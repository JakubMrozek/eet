/**
 * Prevede objekt Date na retezec.
 *
 * Datum je potreba prevest na  ISO 8601, je ale potreba dat pryc ms,
 * protoze jinak vraci EET servery chybu "spatny format".
 *
 */
function formatDate (date) {
  return date.toISOString().split('.')[0] + 'Z'
}

function formatBool (value, defaultValue) {
  if (value === undefined) {
    value = defaultValue
  }
  return value ? 'true' : 'false'
}

function formatNumber (num) {
  return !isNaN(+num) ? (+num).toFixed(2) : num
}

exports.formatDate = formatDate
exports.formatBool = formatBool
exports.formatNumber = formatNumber
