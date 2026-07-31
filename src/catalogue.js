let cataloguePromise;

export function dateId(date = new Date()) {
  return `${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function isoDate(date = new Date()) {
  return `${date.getFullYear()}-${dateId(date)}`;
}

export async function loadCatalogue() {
  if (!cataloguePromise) {
    cataloguePromise = fetch("./content/devotionals.json")
      .then((response) => {
        if (!response.ok) throw new Error("The devotional catalogue could not be opened.");
        return response.json();
      })
      .then((data) => data.devotionals);
  }
  return cataloguePromise;
}

export function devotionalForDate(catalogue, date = new Date()) {
  const id = typeof date === "string" ? date : dateId(date);
  return catalogue.find((item) => item.id === id) || catalogue[0];
}

export function calculateStreak(completions, now = new Date()) {
  let streak = 0;
  const cursor = new Date(now);
  cursor.setHours(12, 0, 0, 0);
  if (!completions[isoDate(cursor)]) cursor.setDate(cursor.getDate() - 1);
  while (completions[isoDate(cursor)]) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}
