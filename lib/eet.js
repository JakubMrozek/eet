'use strict'
const crypto = require('crypto')
const path = require('path')
const soap = require('soap')
const uuid = require('node-uuid')
const WSSecurity = require('./ws-security')
const util = require('./util')
const validate = require('./validate')

// node v4
const formatDate = util.formatDate
const formatBool = util.formatBool
const formatNumber = util.formatNumber
const isDefinedAndNotNull = util.isDefinedAndNotNull

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

 * Polozky (items) jsou popsany u funkce getItemsForBody().
 *
 * Vraci Promise. Pokud je vse v poradku, vrati FIK, v opacnem pripade vraci info o chybe.
 */
function doRequest (options, items) {
  const uid = options.uid || uuid.v4()
  const date = options.currentDate || new Date()
  const soapOptions = {}
  if (options.playground) {
    soapOptions.endpoint = PG_WSDL_URL
  }
  if (options.httpClient) {
    soapOptions.httpClient = options.httpClient
  }

  return new Promise((resolve, reject) => {
    const body = getBodyItems(options.privateKey, date, uid, items)
    soap.createClient(WSDL, soapOptions, (err, client) => {
      if (err) return reject(err)
      client.setSecurity(new WSSecurity(options.privateKey, options.certificate, uid))
      client.OdeslaniTrzby(body, (err, response) => {
        if (err) return reject(err)
        try {
          validate.httpResponse(response)
          resolve(getResponseItems(response))
        } catch (e) {
          reject(e)
        }
      }, {timeout: 2000})
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
    Hlavicka: getHeaderItems(uid, currentDate, items.prvniZaslani, items.overeni),
    Data: getDataItems(items),
    KontrolniKody: getFooterItems(privateKey, items)
  }
}

/**
 * Vygeneruje polozky pro element Hlavicka.
 *
 */
function getHeaderItems (uid, currentDate, prvniZaslani, overeni) {
  return {
    attributes: {
      uuid_zpravy: uid,
      dat_odesl: formatDate(currentDate),
      prvni_zaslani: formatBool(prvniZaslani, true),
      overeni: formatBool(overeni, false)
    }
  }
}

/**
 * Vygeneruje položky pro XML element Data.
 *
 */
function getDataItems (items) {
  validate.requiredItems(items)

  const data = {}
  validate.vatIdNumber(items.dicPopl)
  data.dic_popl = items.dicPopl

  validate.businessPremisesId(items.idProvoz)
  data.id_provoz = items.idProvoz

  validate.cashRegisterId(items.idPokl)
  data.id_pokl = items.idPokl

  validate.receiptNumber(items.poradCis)
  data.porad_cis = items.poradCis

  validate.date(items.datTrzby)
  data.dat_trzby = formatDate(items.datTrzby)

  if (isDefinedAndNotNull(items.rezim)) {
    validate.regime(items.rezim)
    data.rezim = items.rezim
  } else {
    data.rezim = 0
  }

  if (isDefinedAndNotNull(items.dicPoverujiciho)) {
    validate.vatIdNumber(items.dicPoverujiciho)
    data.dic_poverujiciho = items.dicPoverujiciho
  }

  validate.financialNumber(items.celkTrzba)
  data.celk_trzba = formatNumber(items.celkTrzba)

  const map = {
    zaklNepodlDph: 'zakl_nepodl_dph',
    zaklDan1: 'zakl_dan1',
    dan1: 'dan1',
    zaklDan2: 'zakl_dan2',
    dan2: 'dan2',
    zaklDan3: 'zakl_dan3',
    dan3: 'dan3',
    cestSluz: 'cest_sluz',
    pouzitZboz1: 'pouzit_zboz1',
    pouzitZboz2: 'pouzit_zboz2',
    pouzitZboz3: 'pouzit_zboz3',
    urcenoCerpZuct: 'urceno_cerp_zuct',
    cerpZuct: 'cerp_zuct'
  }
  Object.keys(map)
  .filter(key => isDefinedAndNotNull(items[key]))
  .forEach(key => {
    validate.financialNumber(items[key])
    data[map[key]] = formatNumber(items[key])
  })

  return {
    attributes: data
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
    formatDate(items.datTrzby),
    formatNumber(items.celkTrzba)
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
  return {
    uuid: header.uuid_zpravy,
    bkp: header.bkp,
    date: new Date(header.dat_prij),
    test: body.test === 'true',
    fik: body.fik,
    warnings: getWarnings(response.Varovani)
  }
}

function getWarnings (warnings) {
  if (!warnings || !warnings.length) {
    return []
  }
  return warnings.map(warning => warning.$value)
}

exports.generatePKP = generatePKP
exports.generateBKP = generateBKP
exports.doRequest = doRequest
exports.getBodyItems = getBodyItems
exports.getHeaderItems = getHeaderItems
exports.getDataItems = getDataItems
exports.getFooterItems = getFooterItems
exports.getResponseItems = getResponseItems
