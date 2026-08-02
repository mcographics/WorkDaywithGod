const radians = (degrees) => degrees * Math.PI / 180;
const degrees = (radiansValue) => radiansValue * 180 / Math.PI;
const normalize = (value, maximum) => ((value % maximum) + maximum) % maximum;

function dayOfYear(date) {
  const start = Date.UTC(date.getFullYear(), 0, 0);
  const current = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.floor((current - start) / 86_400_000);
}

function solarEvent(date, latitude, longitude, sunrise) {
  const longitudeHour = longitude / 15;
  const approximateTime = dayOfYear(date) + ((sunrise ? 6 : 18) - longitudeHour) / 24;
  const meanAnomaly = (0.9856 * approximateTime) - 3.289;
  const trueLongitude = normalize(
    meanAnomaly + (1.916 * Math.sin(radians(meanAnomaly))) + (0.02 * Math.sin(radians(2 * meanAnomaly))) + 282.634,
    360,
  );
  let rightAscension = normalize(degrees(Math.atan(0.91764 * Math.tan(radians(trueLongitude)))), 360);
  rightAscension += (Math.floor(trueLongitude / 90) * 90) - (Math.floor(rightAscension / 90) * 90);
  rightAscension /= 15;

  const sinDeclination = 0.39782 * Math.sin(radians(trueLongitude));
  const cosDeclination = Math.cos(Math.asin(sinDeclination));
  const localHourCosine = (
    Math.cos(radians(90.833)) - (sinDeclination * Math.sin(radians(latitude)))
  ) / (cosDeclination * Math.cos(radians(latitude)));
  if (localHourCosine > 1 || localHourCosine < -1) return null;

  const localHour = (sunrise ? 360 - degrees(Math.acos(localHourCosine)) : degrees(Math.acos(localHourCosine))) / 15;
  const localMeanTime = localHour + rightAscension - (0.06571 * approximateTime) - 6.622;
  const utcHours = normalize(localMeanTime - longitudeHour, 24);
  const targetKey = date.getFullYear() * 10_000 + (date.getMonth() + 1) * 100 + date.getDate();
  let result = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) + (utcHours * 3_600_000));
  const resultKey = () => result.getFullYear() * 10_000 + (result.getMonth() + 1) * 100 + result.getDate();
  if (resultKey() < targetKey) result = new Date(result.getTime() + 86_400_000);
  else if (resultKey() > targetKey) result = new Date(result.getTime() - 86_400_000);
  return result;
}

export function solarWindow(date, latitude, longitude) {
  return {
    sunrise: solarEvent(date, latitude, longitude, true),
    sunset: solarEvent(date, latitude, longitude, false),
  };
}

export function isSunUp(date, position) {
  if (!position || !Number.isFinite(position.latitude) || !Number.isFinite(position.longitude)) {
    const minutes = date.getHours() * 60 + date.getMinutes();
    return minutes >= 6 * 60 && minutes < 18 * 60;
  }
  const { sunrise, sunset } = solarWindow(date, position.latitude, position.longitude);
  if (!sunrise || !sunset) return date.getHours() >= 6 && date.getHours() < 18;
  return date >= sunrise && date < sunset;
}
