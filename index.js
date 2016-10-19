const crypto = require('crypto')

/**
 * Podpisovy kod poplatnika.
 *
 * @see http://www.etrzby.cz/assets/cs/prilohy/EET_popis_rozhrani_v3.1.1.pdf (sekce 4.1)
 *
 */
function generatePKP (privateKey, dicPopl, idProvoz, idPokl, poradCis, datTrzby, celkTrzba) {
  const options = [dicPopl, idProvoz, idPokl, poradCis, dateToISO(datTrzby), celkTrzba]
  const strToHash = options.join('|')
  const sign = crypto.createSign('RSA-SHA256')
  sign.write(strToHash)
  sign.end()
  return sign.sign(privateKey, 'base64')
}

/**
 * Bezpecnostni kod poplatnika.
 *
 * @see http://www.etrzby.cz/assets/cs/prilohy/EET_popis_rozhrani_v3.1.1.pdf (sekce 4.2)
 *
 */
function generateBKP (pkp) {
  const buffer = new Buffer(pkp, 'base64')
  const hash = crypto.createHash('sha1')
  hash.update(buffer)
  const sha1str = hash.digest('hex').toUpperCase()
  return sha1str.match(/(.{1,8})/g).join('-')
}

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

exports.generatePKP = generatePKP
exports.generateBKP = generateBKP
exports.dateToISO = dateToISO
