/* Ethiopian calendar conversions using Julian Day Numbers.
 * Epoch JDN 1724221; Ethiopian leap days occur when year % 4 === 3.
 * Calendar arithmetic is date-only and deliberately independent of UI/time zones.
 */
export const ETHIOPIAN_EPOCH_JDN = 1724221;
export const ETH_MONTHS_AM = [
  'መስከረም', 'ጥቅምት', 'ኅዳር', 'ታኅሣሥ', 'ጥር', 'የካቲት',
  'መጋቢት', 'ሚያዝያ', 'ግንቦት', 'ሰኔ', 'ሐምሌ', 'ነሐሴ', 'ጳጉሜ'
];
export const ETH_MONTHS_EN = [
  'Meskerem', 'Tikimt', 'Hidar', 'Tahsas', 'Tir', 'Yekatit',
  'Megabit', 'Miyazya', 'Ginbot', 'Sene', 'Hamle', 'Nehase', 'Pagume'
];
export const WEEKDAYS_AM = ['እሁድ', 'ሰኞ', 'ማክሰኞ', 'ረቡዕ', 'ሐሙስ', 'ዓርብ', 'ቅዳሜ'];
export const WEEKDAYS_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function isEthiopianLeapYear(year) {
  return year % 4 === 3;
}

export function daysInEthiopianMonth(year, month) {
  if (!Number.isInteger(year) || year < 1 || !Number.isInteger(month) || month < 1 || month > 13) {
    throw new RangeError('Invalid Ethiopian year or month.');
  }
  if (month <= 12) return 30;
  return isEthiopianLeapYear(year) ? 6 : 5;
}

export function gregorianToJdn(year, month, day) {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day) || month < 1 || month > 12) {
    throw new RangeError('Invalid Gregorian date.');
  }
  const maxDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  if (day < 1 || day > maxDay) throw new RangeError('Invalid Gregorian day.');
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  return day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
}

export function jdnToGregorian(jdn) {
  if (!Number.isInteger(jdn)) throw new RangeError('JDN must be an integer.');
  const a = jdn + 32044;
  const b = Math.floor((4 * a + 3) / 146097);
  const c = a - Math.floor((146097 * b) / 4);
  const d = Math.floor((4 * c + 3) / 1461);
  const e = c - Math.floor((1461 * d) / 4);
  const m = Math.floor((5 * e + 2) / 153);
  const day = e - Math.floor((153 * m + 2) / 5) + 1;
  const month = m + 3 - 12 * Math.floor(m / 10);
  const year = 100 * b + d - 4800 + Math.floor(m / 10);
  return {year, month, day};
}

export function ethiopianToJdn(year, month, day) {
  if (!Number.isInteger(year) || year < 1 || !Number.isInteger(month) || month < 1 || month > 13) {
    throw new RangeError('Invalid Ethiopian year or month.');
  }
  const maxDay = daysInEthiopianMonth(year, month);
  if (!Number.isInteger(day) || day < 1 || day > maxDay) throw new RangeError('Invalid Ethiopian day.');
  return ETHIOPIAN_EPOCH_JDN + 365 * (year - 1) + Math.floor(year / 4) + 30 * (month - 1) + day - 1;
}

export function jdnToEthiopian(jdn) {
  if (!Number.isInteger(jdn) || jdn < ETHIOPIAN_EPOCH_JDN) throw new RangeError('Date precedes the Ethiopian calendar epoch or JDN is invalid.');
  const daysSinceEpoch = jdn - ETHIOPIAN_EPOCH_JDN;
  const year = Math.floor((4 * daysSinceEpoch + 1463) / 1461);
  const firstDayJdn = ETHIOPIAN_EPOCH_JDN + 365 * (year - 1) + Math.floor(year / 4);
  const dayOfYear = jdn - firstDayJdn;
  const month = dayOfYear < 360 ? Math.floor(dayOfYear / 30) + 1 : 13;
  const day = dayOfYear < 360 ? dayOfYear % 30 + 1 : dayOfYear - 360 + 1;
  return {year, month, day};
}

export function gregorianToEthiopian(year, month, day) {
  return jdnToEthiopian(gregorianToJdn(year, month, day));
}

export function ethiopianToGregorian(year, month, day) {
  return jdnToGregorian(ethiopianToJdn(year, month, day));
}

export function localDateParts(date = new Date()) {
  return {year: date.getFullYear(), month: date.getMonth() + 1, day: date.getDate()};
}

export function formatEthiopian(dateOrParts, language = 'am') {
  const parts = dateOrParts instanceof Date ? gregorianToEthiopian(...Object.values(localDateParts(dateOrParts))) : dateOrParts;
  const months = language === 'am' ? ETH_MONTHS_AM : ETH_MONTHS_EN;
  return `${months[parts.month - 1]} ${parts.day}, ${parts.year}`;
}
