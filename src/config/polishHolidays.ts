/**
 * Polskie święta państwowe — stałe i ruchome.
 *
 * Święta ruchome obliczane algorytmicznie (Computus/Meeus)
 * dla dowolnego roku. Eksportuje utility do sprawdzania
 * czy dana data jest świętem polskim.
 */

/** Oblicza datę Niedzieli Wielkanocnej wg algorytmu Meeusa (Computus). */
function computeEasterSunday(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;

  return new Date(year, month - 1, day);
}

/** Dodaje dni do daty i zwraca nową datę. */
function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/** Formatuje datę jako YYYY-MM-DD. */
function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

interface HolidayEntry {
  date: Date;
  name: string;
}

/**
 * Zwraca listę polskich świąt państwowych dla danego roku.
 * Zawiera święta stałe i ruchome (zależne od Wielkanocy).
 */
function getPolishHolidaysList(year: number): HolidayEntry[] {
  const easter = computeEasterSunday(year);

  const fixedHolidays: HolidayEntry[] = [
    { date: new Date(year, 0, 1), name: 'Nowy Rok' },
    { date: new Date(year, 0, 6), name: 'Trzech Króli' },
    { date: new Date(year, 4, 1), name: 'Święto Pracy' },
    { date: new Date(year, 4, 3), name: 'Święto Konstytucji 3 Maja' },
    { date: new Date(year, 7, 15), name: 'Wniebowzięcie NMP' },
    { date: new Date(year, 10, 1), name: 'Wszystkich Świętych' },
    { date: new Date(year, 10, 11), name: 'Święto Niepodległości' },
    { date: new Date(year, 11, 25), name: 'Boże Narodzenie (I dzień)' },
    { date: new Date(year, 11, 26), name: 'Boże Narodzenie (II dzień)' },
  ];

  const movableHolidays: HolidayEntry[] = [
    { date: easter, name: 'Wielkanoc' },
    { date: addDays(easter, 1), name: 'Poniedziałek Wielkanocny' },
    { date: addDays(easter, 49), name: 'Zielone Świątki' },
    { date: addDays(easter, 60), name: 'Boże Ciało' },
  ];

  return [...fixedHolidays, ...movableHolidays];
}

/**
 * Zwraca mapę YYYY-MM-DD → nazwa święta dla danego roku.
 */
export function getPolishHolidays(year: number): Map<string, string> {
  const map = new Map<string, string>();

  for (const holiday of getPolishHolidaysList(year)) {
    map.set(formatDateKey(holiday.date), holiday.name);
  }

  return map;
}

/**
 * Sprawdza, czy data jest polskim świętem państwowym.
 * Zwraca obiekt z flagą `isHoliday` i opcjonalną nazwą.
 */
export function isPolishHoliday(date: Date): { isHoliday: boolean; name?: string } {
  const year = date.getFullYear();
  const holidays = getPolishHolidays(year);
  const key = formatDateKey(date);
  const name = holidays.get(key);

  return name
    ? { isHoliday: true, name }
    : { isHoliday: false };
}

/**
 * Sprawdza, czy data jest dniem weekendowym (sobota lub niedziela).
 */
export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

/**
 * Sprawdza, czy data jest dniem wolnym (weekend lub święto).
 * Zwraca informację o typie dnia wolnego.
 */
export function isDayOff(date: Date): { isDayOff: boolean; reason?: string } {
  const holiday = isPolishHoliday(date);
  if (holiday.isHoliday) {
    return { isDayOff: true, reason: holiday.name };
  }

  if (isWeekend(date)) {
    const dayName = date.getDay() === 0 ? 'Niedziela' : 'Sobota';
    return { isDayOff: true, reason: dayName };
  }

  return { isDayOff: false };
}
