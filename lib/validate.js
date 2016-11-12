const util = require('./util')
const isDefinedAndNotNull = util.isDefinedAndNotNull

/**
 * Zkontroluje, zda jsou zadany všechny povinné položky.
 *
 */
function requiredItems (items) {
  [
    'dicPopl',
    'idPokl',
    'idProvoz',
    'poradCis',
    'datTrzby',
    'celkTrzba'
  ].forEach(item => {
    if (!isDefinedAndNotNull(items[item])) {
      throw new Error(`'${item}' is required.`)
    }
  })
}

/**
 * Validace DIČ.
 *
 */
function vatIdNumber (value) {
  if (!/^CZ[0-9]{8,10}$/.test(value)) {
    throw new Error(`Value '${value}' doesn't match pattern for vat identification number.`)
  }
}

/**
 * Validace označení provozovny.
 *
 */
function businessPremisesId (value) {
  if (!/^[1-9][0-9]{0,5}$/.test(value)) {
    throw new Error(`Value '${value}' doesn't match pattern for business premises ID.`)
  }
}

/**
 * Validace označení pokladny.
 *
 */
function cashRegisterId (value) {
  if (!/^[0-9a-zA-Z\.,:;/#\-_]{1,20}$/.test(value)) {
    throw new Error(`Value '${value}' doesn't match pattern for cash register ID.`)
  }
}

/**
 * Validace čísla účtenky.
 *
 */
function receiptNumber (value) {
  if (!/^[0-9a-zA-Z\.,:;/#\-_]{1,20}$/.test(value)) {
    throw new Error(`Value '${value}' doesn't match pattern for serial number of receipt.`)
  }
}

/**
 * Validace data.
 *
 */
function date (value) {
  if (Object.prototype.toString.call(value) !== '[object Date]' || isNaN(value)) {
    throw new Error(`Value '${value}' is not a date object.`)
  }
}

/**
 * Validace režimu odeslání.
 *
 */
function regime (value) {
  if (!/^[01]$/.test(value)) {
    throw new Error(`Value '${value}' doesn't match pattern for sale regime.`)
  }
}

/**
 * Kontrola číselných hodnot.
 *
 */
function financialNumber (value) {
  const num = Number(value)
  if (value !== num || num < -99999999.99 || num > 99999999.99) {
    throw new Error(`Value '${value}' is not valid number.`)
  }
}

exports.requiredItems = requiredItems
exports.vatIdNumber = vatIdNumber
exports.businessPremisesId = businessPremisesId
exports.cashRegisterId = cashRegisterId
exports.receiptNumber = receiptNumber
exports.date = date
exports.regime = regime
exports.financialNumber = financialNumber
