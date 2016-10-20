const crypto = require('crypto')
const path = require('path')
const soap = require('soap')
const WSSecurity = require('./ws-security')

const WSDL_PLAYGROUND = path.join(__dirname, 'wsdl/playground.wsdl')

/**
 * Vygeneruje podpisovy kod poplatnika.
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
function send (privateKey, certificate) {
  const items = getItemsForBody()
  const options = {}

  return new Promise((resolve, reject) => {
    soap.createClient(WSDL_PLAYGROUND, options, (err, client) => {
      if (err) return reject(err)

      const password = ''
      const wsSecurity = new WSSecurity(privateKey, certificate, password, 'utf8')
      client.setSecurity(wsSecurity)

      client.OdeslaniTrzby(items, (err, a) => {
        if (err) return reject(err)
        resolve('ok')

        // console.log(client.lastRequest, a)
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
function getItemsForBody () {
  const items = {
    Hlavicka: {
      attributes: {}
    },
    Data: {
      attributes: {}
    },
    KontrolniKody: {
      attributes: {}
    }
  }

  const args = {
    Hlavicka: {
      attributes: {
        uuid_zpravy: 'ab1bc7a0-5ab0-4d61-a170-2982f2d83784',
        dat_odesl: '2014-09-19T19:06:37+02:00',
        prvni_zaslani: 'false'
      }
    },
    Data: {
      attributes: {
        celk_trzba: '34113.00',
        dat_trzby: '2016-08-05T00:30:12+02:00',
        dic_popl: 'CZ1212121218',
        id_pokl: '/5546/RO24',
        id_provoz: '273',
        porad_cis: '0/6460/ZQ42',
        rezim: '0'
      }
    },
    KontrolniKody: {
      pkp: {
        attributes: {
          digest: 'SHA256',
          cipher: 'RSA2048',
          encoding: 'base64'
        },
        $value: 'JvCv0lXfT74zuviJaHeO91guUfum1MKhq0NNPxW0YlBGvIIt+I4QxEC3QP6BRwEkIS14n2WN+9oQ8nhQPYwZX7L4W9Ie7CYv1ojcl/YiF4560EdB3IpRNRj3UjQlwSZ5ucSM9vWqp0UTbhJDSUk5/WjC/CEiSYv7OQIqa0NJ0f0+ldzGveLRSF34eu2iqAhs/yfDnENlnMDPVB5ko/zQO0vcC93k5DEWEoytTIAsKd6jKSO7eama8Qe+d0wq9vBzudkfLgCe2C1iERJuyHknhjo9KOx10h5wk99QqVGX8tthpAmryDcX2N0ZGkzJHuzzebnYsxXFYI2tKOJLiLLoLQ=='
      },
      bkp: {
        attributes: {
          digest: 'SHA1',
          encoding: 'base16'
        },
        $value: '3F9119C1-FBF34535-D30B60F8-9859E4A6-C8C8AAFA'
      }
    }
  }
  return args
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
exports.send = send
exports.getItemsForBody = getItemsForBody
exports.dateToISO = dateToISO
