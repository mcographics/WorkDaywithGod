const bookAliases = {
  Ps: "Psalms",
  Psalm: "Psalms",
  Prov: "Proverbs",
  Isa: "Isaiah",
  Jas: "James",
  "1 Pet": "1 Peter",
  Lam: "Lamentations",
};

export const translations = [
  { id: "KJV", label: "King James Version" },
  { id: "ASV", label: "American Standard Version" },
  { id: "DBT", label: "Darby Bible Translation" },
  { id: "DRB", label: "Douay-Rheims Bible" },
  { id: "ERV", label: "English Revised Version" },
  { id: "JPS", label: "JPS 1917" },
  { id: "WBT", label: "Webster Bible Translation" },
  { id: "YLT", label: "Young’s Literal Translation" },
  { id: "GENEVA_BIBLE1560", label: "Geneva Bible 1560" },
];

const libraryPromises = new Map();

function loadTranslation(translation) {
  if (!translations.some((item) => item.id === translation)) {
    return Promise.reject(new Error("That translation is not available."));
  }
  if (!libraryPromises.has(translation)) {
    const filename = translation.toLowerCase().replaceAll("_", "-");
    libraryPromises.set(translation, fetch(`./content/${filename}.json`).then((response) => {
      if (!response.ok) throw new Error(`The local ${translation} library could not be opened.`);
      return response.json();
    }));
  }
  return libraryPromises.get(translation);
}

export function parseReference(reference) {
  const match = reference.match(/^(.+?)\s+(\d+):(\d+)$/);
  if (!match) return null;
  return {
    book: bookAliases[match[1]] || match[1],
    chapter: Number(match[2]),
    verse: Number(match[3]),
  };
}

export async function getChapter(reference, translation = "KJV") {
  const parsed = parseReference(reference);
  if (!parsed) throw new Error(`Unsupported Scripture reference: ${reference}`);

  const bible = await loadTranslation(translation);
  const book = bible.books.find((item) => item.name === parsed.book);
  const chapter = book?.chapters.find((item) => item.number === parsed.chapter);
  if (!book || !chapter) throw new Error(`${reference} was not found in the local KJV library.`);

  return {
    translation: bible.translation,
    book: book.name,
    chapter: chapter.number,
    selectedVerse: parsed.verse,
    verses: chapter.verses,
  };
}
