// from ambient-ts-app

import numbro from 'numbro';

function precisionOfInput(inputString) {
  if (inputString.includes('.')) {
    return inputString.split('.')[1].length;
  }
  return 0;
};

function truncateDecimals(num, decimalPlaces) {
  return num % 1 ? num.toFixed(decimalPlaces) : num.toString();
}


export function getFormattedNumber(
  value,
  minFracDigits = 2,
  maxFracDigits = 2,
  isToken = false,
  abbrevThreshold = 10000) {
  if (typeof (value) == 'string')
    value = parseFloat(value)
  let valueString = '';
  if (value === 0) {
    valueString = '0.00';
  } else if (!value) {
    return '…';
  } else if (value === Infinity) {
    valueString = '∞';
  } else if (value <= 0.0001) {
    // use subscript format for small numbers
    valueString = formatSubscript(value);
  } else if (value < 1) {
    // show 3 significant digits (after 0s)
    valueString = value.toPrecision(3);
  } else if (value < 2) {
    // restrict to 3 places after decimal
    valueString = value.toFixed(3);
  } else if (value >= abbrevThreshold) {
    // use abbreviations (k, M, B, T) for big numbers
    valueString = formatAbbrev(value, false);
  } else {
    valueString = value.toLocaleString('en-US', {
      minimumFractionDigits: minFracDigits,
      maximumFractionDigits: maxFracDigits,
    });
  }
  return `${valueString}`;
}

// unicode for subscript - currently support up to 20
const subscriptUnicode = [
  '',
  '0',
  '0\u{2082}',
  '0\u{2083}',
  '0\u{2084}',
  '0\u{2085}',
  '0\u{2086}',
  '0\u{2087}',
  '0\u{2088}',
  '0\u{2089}',
  '0\u{2081}\u{2080}',
  '0\u{2081}\u{2081}',
  '0\u{2081}\u{2082}',
  '0\u{2081}\u{2083}',
  '0\u{2081}\u{2084}',
  '0\u{2081}\u{2085}',
  '0\u{2081}\u{2086}',
  '0\u{2081}\u{2087}',
  '0\u{2081}\u{2088}',
  '0\u{2081}\u{2089}',
  '0\u{2082}\u{2080}',
];

function formatSubscript(value, precision = 3) {
  // math to find number of 0s after the decimal
  const zeros = Math.ceil(Math.log10(1 / value)) - 1;
  const valueNonZero = Math.round(value * 10 ** (zeros + precision));
  if (zeros > 20) {
    return '0';
  }
  return `0.${subscriptUnicode[zeros]}${valueNonZero}`;
};

function formatAbbrev(value, isTvl = false) {
  return numbro(value).format({
    average: true,
    ...(isTvl && { roundingFunction: (num) => Math.floor(num) }),
    mantissa: 2,
    abbreviations: {
      thousand: 'k',
      million: 'M',
      billion: 'B',
      trillion: 'T',
    },
  });
};


