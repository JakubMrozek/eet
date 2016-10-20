const crypto = require('crypto')
const path = require('path')
const soap = require('soap')
const uuid = require('node-uuid')
const WSSecurity = require('./ws-security')
const {dateToISO} = require('./util')

const WSDL = path.join(__dirname, '..', 'wsdl/WSDL.wsdl')
const PG_WSDL_URL = 'https://pg.eet.cz:443/eet/services/EETServiceSOAP/v3/'

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
function doRequest (options, items) {
  const uid = options.uid || uuid.v4()
  const date = options.currentDate || new Date()
  const body = getBodyItems(options.privateKey, date, uid, items)

  const soapOptions = {}
  if (options.playground) {
    soapOptions.endpoint = PG_WSDL_URL
  }
  if (options.httpClient) {
    soapOptions.httpClient = options.httpClient
  }

  return new Promise((resolve, reject) => {
    soap.createClient(WSDL, soapOptions, (err, client) => {
      if (err) return reject(err)
      const wsSec = new WSSecurity(options.privateKey, options.certificate, uid)
      client.setSecurity(wsSec)
      client.OdeslaniTrzby(body, (err, response) => {
        if (err) return reject(err)
        const responseError = getResponseError(response)
        if (responseError) {
          return reject(responseError)
        }
        resolve(getResponseItems(response))
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
function getBodyItems (privateKey, currentDate, uid, items) {
  return {
    Hlavicka: getHeaderItems(uid, currentDate),
    Data: getDataItems(items),
    KontrolniKody: getFooterItems(privateKey, items)
  }
}

/**
 * Vygeneruje polozky pro element Hlavicka.
 *
 */
function getHeaderItems (uid, date) {
  return {
    attributes: {
      uuid_zpravy: uid,
      dat_odesl: dateToISO(date),
      prvni_zaslani: 'false'
    }
  }
}

/**
 * Vygeneruje polozky pro element Data.
 *
 */
function getDataItems (items) {
  return {
    attributes: {
      celk_trzba: items.celkTrzba,
      dat_trzby: dateToISO(items.datTrzby),
      dic_popl: items.dicPopl,
      id_pokl: items.idPokl,
      id_provoz: items.idProvoz,
      porad_cis: items.poradCis,
      rezim: '0'
    }
  }
}

/**
 * Vygeneruje polozky pro element KontrolniKody.
 *
 */
function getFooterItems (privateKey, items) {
  const pkp = generatePKP(
    privateKey,
    items.dicPopl,
    items.idProvoz,
    items.idPokl,
    items.poradCis,
    dateToISO(items.datTrzby),
    items.celkTrzba
  )
  const bkp = generateBKP(pkp)

  return {
    pkp: {
      attributes: {
        digest: 'SHA256',
        cipher: 'RSA2048',
        encoding: 'base64'
      },
      $value: pkp
    },
    bkp: {
      attributes: {
        digest: 'SHA1',
        encoding: 'base16'
      },
      $value: bkp
    }
  }
}

/**
 * Zpracuje OK odpoved ze serveru EET.
 *
 */
function getResponseItems (response) {
  const header = response.Hlavicka.attributes
  const body = response.Potvrzeni.attributes
  if (!header || !body) {
    return false
  }
  return {
    uuid: header.uuid_zpravy,
    bkp: header.bkp,
    date: new Date(header.dat_prij),
    test: body.test === 'true',
    fik: body.fik
  }
}

/**
 * Zpracuje chybnou odpoved.
 *
 */
function getResponseError (response) {
  if (!response) {
    return new Error('Unable to parse response.')
  }
  const errorAttrs = response.Chyba && response.Chyba.attributes
  if (errorAttrs) {
    return new Error(`${response.Chyba.$value} (${errorAttrs.kod})`)
  }
  const body = response.Potvrzeni && response.Potvrzeni.attributes
  const header = response.Hlavicka && response.Hlavicka.attributes
  if (!body || !header) {
    return new Error('Unable to read response.')
  }
}

exports.generatePKP = generatePKP
exports.generateBKP = generateBKP
exports.doRequest = doRequest
exports.getBodyItems = getBodyItems
exports.getHeaderItems = getHeaderItems
exports.getDataItems = getDataItems
exports.getFooterItems = getFooterItems
exports.getResponseItems = getResponseItems
exports.getResponseError = getResponseError
