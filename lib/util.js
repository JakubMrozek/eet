/**
 * Prevede objekt Date na retezec.
 *
 * Datum je potreba prevest na  ISO 8601, je ale potreba dat pryc ms,
 * protoze jinak vraci EET servery chybu "spatny format".
 *
 */
function dateToISO (date) {
  return date.toISOString().split('.')[0] + 'Z'
}

exports.dateToISO = dateToISO
