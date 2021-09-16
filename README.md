# Balíček je archivován a už neplánuji jeho správu

---

# eet

Node.js knihovna pro EET ([elektronickou evidenci tržeb](http://www.etrzby.cz/cs/technicka-specifikace)).

## Instalace 

Je nutné mít nainstalovaný Node.js v4+.

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

// ziskani FIK (kod uctenky) pomoci async/await (Node.js 8+ / Babel)
const {fik} = await eet(options, items)

// ziskani FIK v Node.js 6+
eet(options, items).then(response => {
  // response.fik
})
```

## Převod .p12 na .pem

Balíček pracuje s klíči v textovém formátu, z binárního .p12 je lze převést např. pomocí balíčku [pem](https://github.com/andris9/pem):

```javascript
// npm install pem
const pem = require('pem')

const file = require('fs').readFileSync('cesta/k/souboru.p12')
const password = '' //pro testovací certifikáty EET je heslo 'eet'

pem.readPkcs12(file, {p12Password: password}, (err, result) => {
  if (err) ...
  // result.key je privátní klíč
  // result.cert je certifikát
})

```

## Nastavení

### eet (options, items)

* *options* - Volby pro odesílání požadavku (pro SOAP).
  * *options.privateKey* (string) - Privátní klíč.
  * *options.certificate* (string) - Certifikát.
  * *options.playground* (bool) - Posílat požadavky na playground? Def. false (ne).
  * *options.httpClient* - Viz [soap options](https://github.com/vpulim/node-soap#options), slouží pro testování.
  * *options.timeout* (number) - Nastavení max. timeoutu (defaultně 2000 ms)
  * *options.offline* (bool) - Do chybové hlášky vkládat PKP a BKP
* *items* - Položky, které se posílají do EET. Mají stejný název jako ve specifikaci EET, jen používají cammel case (tedy místo dic_popl se používá dicPopl).

## Časté chyby

### Neplatny podpis SOAP zpravy (4)

Na 99% půjde o problém s certifikátem, více je popsáno v issue [#1](https://github.com/JakubMrozek/eet/issues/1#issuecomment-256877574).


## Changelog

### v0.8 (3. 9. 2019)
- upgrade balíčku soap na nejnovější verzi (podpora Node.js 12+)

### v0.7 (6. 3. 2017)
- vrácena podpora pro Node.js v4 ([#16](https://github.com/JakubMrozek/eet/pull/16))
- oprava regulárního výrazu pro kontrolu formátu pokladny ([#13](https://github.com/JakubMrozek/eet/pull/13))

### v0.6 (6. 2. 2017)
- doplněna volba `options.offline`
- balíček uuid aktualizován na 3.0

### v0.5 (2. 12. 2016) + v0.5.1
- doplněna možnost určit timeout 

### v0.4 (13. 11. 2016)
- oprava generování PKP ([#6](https://github.com/JakubMrozek/eet/issues/6))
- privátní klíč není potřeba převádět na buffer ([#4](https://github.com/JakubMrozek/eet/pull/4))

### v0.3 (13. 11. 2016)
- doplněny validace
- v odpovědi se vrací warningy

### v0.2 (30. 10. 2016)
- podpora verze Node.js 4+
- doplněna dokumentace (časté chyby a převod z .p12 na .pem pomocí balíčku `pem`)

### v0.1 (20. 10. 2016)
- první veřejná verze

## Licence

MIT
