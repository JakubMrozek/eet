import test from 'ava'
import {generateBkp} from '.'

test('generate bkp', t => {
  // http://www.etrzby.cz/assets/cs/prilohy/CZ1212121218.valid.v3.1.xml
  const pkp = 'JvCv0lXfT74zuviJaHeO91guUfum1MKhq0NNPxW0YlBGvIIt+I4QxEC3QP6BRwEkIS14n2WN+9oQ8nhQPYwZX7L4W9Ie7CYv1ojcl/YiF4560EdB3IpRNRj3UjQlwSZ5ucSM9vWqp0UTbhJDSUk5/WjC/CEiSYv7OQIqa0NJ0f0+ldzGveLRSF34eu2iqAhs/yfDnENlnMDPVB5ko/zQO0vcC93k5DEWEoytTIAsKd6jKSO7eama8Qe+d0wq9vBzudkfLgCe2C1iERJuyHknhjo9KOx10h5wk99QqVGX8tthpAmryDcX2N0ZGkzJHuzzebnYsxXFYI2tKOJLiLLoLQ=='
  t.is(generateBkp(pkp), '3F9119C1-FBF34535-D30B60F8-9859E4A6-C8C8AAFA')
})
