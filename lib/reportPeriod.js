function utcDate(year, month, day) {
  return new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
}

function toDateOnly(date) {
  return date.toISOString().slice(0, 10);
}

export function getReportPeriod(referenceDate = new Date()) {
  const year = referenceDate.getUTCFullYear();
  const month = referenceDate.getUTCMonth();

  const end = utcDate(year, month, 10);
  const start = utcDate(year, month - 1, 10);

  return {
    startDate: toDateOnly(start),
    endDate: toDateOnly(end),
    label: `${start.getUTCFullYear()}-${String(start.getUTCMonth() + 1).padStart(2, "0")}-10 至 ${end.getUTCFullYear()}-${String(end.getUTCMonth() + 1).padStart(2, "0")}-10`
  };
}
