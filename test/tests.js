import fs from 'fs'
import test from 'ava'
import eet from '../lib/eet'
import util from '../lib/util'

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

test('date to ISO', t => {
  const date = new Date('2016-08-05T00:30:12+02:00')
  t.is(util.dateToISO(date), '2016-08-04T22:30:12Z')
})

test('send', async t => {
  const data = {
    dicPopl: 'CZ1212121218',
    idPokl: '/5546/RO24',
    poradCis: '0/6460/ZQ42',
    datTrzby: new Date('2016-08-05T00:30:12+02:00'),
    celkTrzba: '34113.00',
    idProvoz: '273'
  }
  const result = await eet.send(PRIVATE_KEY, CERTIFICATE, data)
  console.log(result)
})
