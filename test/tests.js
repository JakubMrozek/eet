import test from 'ava'
import eet from '..'
import {TEST_PKP, TEST_PRIVATE_KEY} from './data'

test('generate PKP', t => {
  const result = eet.generatePKP(
    TEST_PRIVATE_KEY,
    'CZ1212121218',
    '273',
    '/5546/RO24',
    '0/6460/ZQ42',
    new Date('2016-08-05T00:30:12+02:00'),
    '34113.00'
  )
  t.is(result, TEST_PKP)
})

test('generate BKP', t => {
  t.is(eet.generateBKP(TEST_PKP), '3F9119C1-FBF34535-D30B60F8-9859E4A6-C8C8AAFA')
})

test('date to ISO', t => {
  const date = new Date('2016-08-05T00:30:12+02:00')
  t.is(eet.dateToISO(date), '2016-08-04T22:30:12Z')
})
