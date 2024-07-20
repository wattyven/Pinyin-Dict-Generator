const fs = require('fs');
const https = require('https');

const url = 'https://raw.githubusercontent.com/mozillazg/pinyin-data/master/pinyin.txt';
const outputFile = 'pinyinDict.json';

function convertCodePointToChar(codePoint) {
    if (codePoint > 0xFFFF) { // for code points above 0xFFFF, use surrogate pairs then combine them into a single character
        const highSurrogate = Math.floor((codePoint - 0x10000) / 0x400) + 0xD800;
        const lowSurrogate = ((codePoint - 0x10000) % 0x400) + 0xDC00;
        return String.fromCharCode(highSurrogate, lowSurrogate); // combine high and low surrogates
    }
    return String.fromCharCode(codePoint); // return single character
}

https.get(url, (response) => {
  let data = '';

  response.on('data', (chunk) => {
    data += chunk;
  });

  response.on('end', () => {
    const lines = data.split('\n');
    const pinyinDict = {};

    lines.forEach((line, index) => {
      if (line && !line.startsWith('#')) { // ignore comments
        const [code, pinyin] = line.split(':'); 
        if (code && pinyin) { // check if both code and pinyin are present
          try {
            const codePoint = parseInt(code.trim().replace('U+', ''), 16);
            if (!isNaN(codePoint)) {
              const char = convertCodePointToChar(codePoint);
              const cleanPinyin = pinyin.trim().split(/\s+/)[0]; // strip whitespace and comments repeating chars from string
              const pinyinList = cleanPinyin.split(',');
              pinyinDict[char] = pinyinList; // store pinyin as a list
            } else {
              console.warn(`Bad code point, line ${index + 1}: ${line}`); // debug
            }
          } catch (error) {
            console.error(`Error, line ${index + 1}: ${line}`); // debug
            console.error(error);
          }
        } else {
          console.warn(`Bad line, index ${index + 1}: ${line}`); // debug
        }
      }
    });

    const dictString = JSON.stringify(pinyinDict, null, 2);
    
    fs.writeFile(outputFile, dictString, (err) => {
      if (err) throw err;
      console.log(`Pinyin dictionary saved to ${outputFile}`);
      console.log(`Total characters processed: ${Object.keys(pinyinDict).length}`); // as of 20 Jul 2024, expected 41651
      // check if the dictionary is complete
      if (Object.keys(pinyinDict).length >= 41651) {
        console.log('Pinyin dictionary generated successfully');
      } else {
        console.warn('Pinyin dictionary may be incomplete');
      }
    });
  });
}).on('error', (err) => {
  console.error(`Error: ${err.message}`);
});
