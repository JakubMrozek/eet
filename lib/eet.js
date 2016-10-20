const crypto = require('crypto')
const path = require('path')
const soap = require('soap')
const uuid = require('node-uuid')
const WSSecurity = require('./ws-security')
const {dateToISO} = require('./util')

const WSDL_PLAYGROUND = path.join(__dirname, '..', 'wsdl/playground.wsdl')

/**
 * Vygeneruje podpisovy kod poplatnika.
 *
 * @see http://www.etrzby.cz/assets/cs/prilohy/EET_popis_rozhrani_v3.1.1.pdf (sekce 4.1)
 *
 */
function generatePKP (privateKey, dicPopl, idProvoz, idPokl, poradCis, datTrzby, celkTrzba) {
  const options = [dicPopl, idProvoz, idPokl, poradCis, datTrzby, celkTrzba]
  const strToHash = options.join('|')
  const sign = crypto.createSign('RSA-SHA256')
  sign.write(strToHash)
  sign.end()
  return sign.sign(privateKey, 'base64')
}

/**
 * Vygeneruje bezpecnostni kod poplatnika.
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
 * Odeslani platby do EET.
 *
 * Volby:
 * - options.playground (boolean): povolit testovaci prostredi, def. false
 * - options.test (boolean): odesilaci mod (overeni), ostry = false, overovaci = true, def. false
 *
 * Polozky (items) jsou popsany u funkce getItemsForBody().
 *
 * Vraci Promise. Pokud je vse v poradku, vrati FIK, v opacnem pripade vraci info o chybe.
 */
function send (privateKey, certificate, dataItems) {
  const uid = uuid.v4()
  const currentDate = new Date()
  const items = getItemsForBody(privateKey, currentDate, uid, dataItems)
  const options = {}

  return new Promise((resolve, reject) => {
    soap.createClient(WSDL_PLAYGROUND, options, (err, client) => {
      if (err) return reject(err)
      client.setSecurity(new WSSecurity(privateKey, certificate))
      client.OdeslaniTrzby(items, (err, a) => {
        if (err) return reject(err)
        resolve(a)
      })
    })
  })
}

/**
 * Vrati vsechny polozky pro obsah SOAP body.
 *
 * Polozky:
 *
 */
function getItemsForBody (privateKey, currentDate, uid, data) {
  const datTrzbyISO = dateToISO(data.datTrzby)
  const PKP = generatePKP(
    privateKey,
    data.dicPopl,
    data.idProvoz,
    data.idPokl,
    data.poradCis,
    datTrzbyISO,
    data.celkTrzba
  )
  const BKP = generateBKP(PKP)

  const items = {}
  items.Hlavicka = {
    attributes: {
      uuid_zpravy: uid,
      dat_odesl: dateToISO(currentDate),
      prvni_zaslani: 'false'
    }
  }

  items.Data = {
    attributes: {
      celk_trzba: data.celkTrzba,
      dat_trzby: datTrzbyISO,
      dic_popl: data.dicPopl,
      id_pokl: data.idPokl,
      id_provoz: data.idProvoz,
      porad_cis: data.poradCis,
      rezim: '0'
    }
  }

  items.KontrolniKody = {
    pkp: {
      attributes: {digest: 'SHA256', cipher: 'RSA2048', encoding: 'base64'},
      $value: PKP
    },
    bkp: {
      attributes: {digest: 'SHA1', encoding: 'base16'},
      $value: BKP
    }
  }

  return items
}

exports.generatePKP = generatePKP
exports.generateBKP = generateBKP
exports.send = send
exports.getItemsForBody = getItemsForBody
