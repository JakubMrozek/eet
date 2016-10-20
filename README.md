# eet

Node.js knihovna pro EET ([elektronickou evidenci tržeb](http://www.etrzby.cz/cs/technicka-specifikace)).

*Upozornění: berte prosím na vědomí, že je balíček ve vývoji (verze 0.x). API se sice už měnit nebude, nicméně chybí především více testů a dokumentace. Pull requesty samozřejmě uvítám:-)*

## Instalace 

```
npm install eet
```

## Příklad

```javascript
const eet = require('eet')

// privatni klic a certifikat podnikatele
const options = {
  privateKey: '...',
  certificate: '...',
  playground: true
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

// ziskani FIK v Node.js 6+
eet(options, items).then(response => {
  // response.fik
})
```

## Převod .p12 na .pem

Balíček pracuje s klíči v textovém formátu, z binárního .p12 se převede pomocí openSSL:

```
openssl pkcs12 -in soubor.p12 -out certifikat.pem -clcerts -nokeys
openssl pkcs12 -in soubor.p12 -out privateni-klic.pem -nocerts -nodes
```

Alternativně lze klíče získat pomocí balíčku [pem](https://github.com/andris9/pem) a funkce `readPkcs12`.


## Nastavení

### eet (options, items)

* *options* - Volby pro odesílání požadavku (pro SOAP).
  * *options.privateKey* (string) - Privátní klíč.
  * *options.certificate* (string) - Certifikát.
  * *options.playground* (bool) - Posílat požadavky na playground? Def. false (ne).
  * *options.httpClient* - Viz [soap options](https://github.com/vpulim/node-soap#options), slouží pro testování.
* *items* - Položky, které se posílají do EET. Mají stejný název jako ve specifikaci EET, jen používají cammel case (tedy místo dic_popl se používá dicPopl).


## Changelog

### v0.1(20. 10. 2016)
- první veřejná verze


## Licence

MIT
