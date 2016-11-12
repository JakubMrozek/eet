import fs from 'fs'
import test from 'ava'
import eet from '../lib/eet'
import util from '../lib/util'
import validate from '../lib/validate'

const PRIVATE_KEY = fs.readFileSync('./keys/private.pem')
const CERTIFICATE = fs.readFileSync('./keys/certificate.pem')
const TEST_PKP = 'JvCv0lXfT74zuviJaHeO91guUfum1MKhq0NNPxW0YlBGvIIt+I4QxEC3QP6BRwEkIS14n2WN+9oQ8nhQPYwZX7L4W9Ie7CYv1ojcl/YiF4560EdB3IpRNRj3UjQlwSZ5ucSM9vWqp0UTbhJDSUk5/WjC/CEiSYv7OQIqa0NJ0f0+ldzGveLRSF34eu2iqAhs/yfDnENlnMDPVB5ko/zQO0vcC93k5DEWEoytTIAsKd6jKSO7eama8Qe+d0wq9vBzudkfLgCe2C1iERJuyHknhjo9KOx10h5wk99QqVGX8tthpAmryDcX2N0ZGkzJHuzzebnYsxXFYI2tKOJLiLLoLQ=='

test('generate PKP', t => {
  const result = eet.generatePKP(
    PRIVATE_KEY,
    'CZ1212121218',
    '273',
    '/5546/RO24',
    '0/6460/ZQ42',
    '2016-08-05T00:30:12+02:00',
    '34113.00'
  )
  t.is(result, TEST_PKP)
})

test('generate BKP', t => {
  t.is(eet.generateBKP(TEST_PKP), '3F9119C1-FBF34535-D30B60F8-9859E4A6-C8C8AAFA')
})

test('format date', t => {
  const date = new Date('2016-08-05T00:30:12+02:00')
  t.is(util.formatDate(date), '2016-08-04T22:30:12Z')
})

test('format number', t => {
  t.is(util.formatNumber(12), '12.00')
})

test('validate required', t => {
  t.notThrows(() => validate.requiredItems({
    dicPopl: 'CZ1212121218',
    idPokl: 1,
    idProvoz: 1,
    poradCis: '2016-0001s',
    datTrzby: new Date(),
    celkTrzba: 1000
  }))
  t.throws(() => validate.requiredItems({
    idPokl: 1
  }))
})

test('validate vat id number', t => {
  t.notThrows(() => validate.vatIdNumber('CZ1212121218'))
  t.throws(() => validate.vatIdNumber(1212121218))
})

test('validate business premises id', t => {
  t.notThrows(() => validate.businessPremisesId(25))
  t.throws(() => validate.businessPremisesId(12345678))
})

test('validate cash register id', t => {
  t.notThrows(() => validate.cashRegisterId('1aZ.,:;/#-_'))
  t.throws(() => validate.cashRegisterId('@@@'))
})

test('validate receipt number', t => {
  t.notThrows(() => validate.receiptNumber('0aA.,:;/#-_'))
  t.throws(() => validate.receiptNumber('@@@'))
})

test('validate date', t => {
  t.notThrows(() => validate.date(new Date()))
  t.throws(() => validate.date(new Date('test')))
  t.throws(() => validate.date('test'))
})

test('validate regime', t => {
  t.notThrows(() => validate.regime(1))
  t.notThrows(() => validate.regime('1'))
  t.throws(() => validate.regime('test'))
})

test('validate financial number', t => {
  t.notThrows(() => validate.financialNumber(1000))
  t.notThrows(() => validate.financialNumber(0))
  t.notThrows(() => validate.financialNumber(-1000))
  t.throws(() => validate.financialNumber('1000,00'))
  t.throws(() => validate.financialNumber('test'))
})

test('get data items', t => {
  const result = eet.getDataItems({
    dicPopl: 'CZ1212121218',
    idPokl: '/5546/RO24',
    poradCis: '0/6460/ZQ42',
    datTrzby: new Date('2016-08-05T00:30:12+02:00'),
    celkTrzba: -34113.8,
    idProvoz: '273'
  })
  const expected = {
    dic_popl: 'CZ1212121218',
    id_pokl: '/5546/RO24',
    porad_cis: '0/6460/ZQ42',
    dat_trzby: '2016-08-04T22:30:12Z',
    celk_trzba: '-34113.80',
    id_provoz: '273',
    rezim: 0
  }
  t.deepEqual(result.attributes, expected)
})

test('do request', async t => {
  const data = {
    prvniZaslani: true,
    overeni: false,
    dicPopl: 'CZ1212121218',
    idPokl: '/5546/RO24',
    poradCis: '0/6460/ZQ42',
    datTrzby: new Date('2016-08-05T00:30:12+02:00'),
    celkTrzba: 34113.00,
    idProvoz: '273'
  }
  const options = {
    playground: true,
    privateKey: PRIVATE_KEY,
    certificate: CERTIFICATE
  }
  const {fik} = await eet.doRequest(options, data)
  // TODO offline
  t.truthy(fik.length === 39)
})
