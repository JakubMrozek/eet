# eet

Node.js knihovna pro EET (elektronickou evidenci tržeb).

## Instalace 

```
npm install eet
```

Testováno s Node.js verzí 4.6.1.

## Příklad

```javascript
const eet = require('eet')

// privatni klic a certifikat podnikatele
const options = {
  privateKey: '...',
  certificate: '...'
}

// polozky, ktere se posilaji do EET 
const items = {
  dicPopl: 'CZ1212121218',
  idPokl: '/5546/RO24',
  poradCis: '0/6460/ZQ42',
  datTrzby: new Date(),
  celkTrzba: 34113,
  idProvoz: '273'
}

// ziskani FIK (kod uctenky) pomoci async/await
const {fik} = await eet(options, items)

// ziskani FIK v Node.js 4+
eet(options, items).then(response => {
  // response.fik
})
```

## Changelog

### v1.0 (20. 10. 2016)
- první veřejná verze


## Licence

MIT
