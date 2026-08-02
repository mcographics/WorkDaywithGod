function localDayNumber(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

export function calendarStartMonth(mode, today = new Date()) {
  const anchor = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  if (mode === "history") anchor.setDate(anchor.getDate() - 1);
  return new Date(anchor.getFullYear(), anchor.getMonth(), 1);
}

export function isCalendarDateAvailable(mode, date, today = new Date()) {
  const dateNumber = localDayNumber(date);
  const todayNumber = localDayNumber(today);
  return mode === "history" ? dateNumber < todayNumber : dateNumber >= todayNumber;
}

export function isAdjacentReadingAvailable(scope, date, today = new Date()) {
  const dateNumber = localDayNumber(date);
  const todayNumber = localDayNumber(today);
  if (scope === "past") return dateNumber < todayNumber;
  if (scope === "future") return dateNumber >= todayNumber;
  return false;
}
