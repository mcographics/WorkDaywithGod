const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const bible = JSON.parse(fs.readFileSync(path.join(root, "data", "electron_cache", "KJV.json"), "utf8"));
const output = path.join(root, "public", "content", "devotionals.json");
const translationFiles = ["KJV","ASV","DBT","DRB","ERV","JPS","WBT","YLT","GENEVA_BIBLE1560"];
const availableReferences = translationFiles.map((name) => {
  const translation = JSON.parse(fs.readFileSync(path.join(root, "data", "electron_cache", `${name}.json`), "utf8"));
  const references = new Set();
  for (const book of translation.books) {
    for (const chapter of book.chapters) {
      for (const verse of chapter.verses) references.add(`${book.name} ${chapter.number}:${verse.num}`);
    }
  }
  return references;
});

const themes = [
  { name: "Surrender", keywords: ["commit", "trust", "way", "will", "purpose"], titles: ["Place It in His Hands", "The Grace of Letting Go", "A Surrendered Beginning"], question: "What can you place into God’s hands today?", prayer: "Lord, receive my plans and guide my steps. Help me work with trust instead of control. Amen." },
  { name: "Peace", keywords: ["peace", "quiet", "still", "rest", "fear not"], titles: ["A Quiet Centre", "Peace for This Moment", "Stillness Before the Next Step"], question: "Where do you need God’s peace to steady you today?", prayer: "God of peace, quiet what is anxious in me and make me attentive to Your presence. Amen." },
  { name: "Faithfulness", keywords: ["faithful", "diligent", "work", "labour", "hand"], titles: ["Faithful in the Ordinary", "The Work Before You", "A Steady and Willing Heart"], question: "What ordinary responsibility can you offer to God with greater care?", prayer: "Lord, make me faithful in small things and sincere in every responsibility You give me. Amen." },
  { name: "Wisdom", keywords: ["wisdom", "understanding", "knowledge", "teach", "counsel"], titles: ["Wisdom for the Way", "Before You Answer", "A Heart Willing to Learn"], question: "Which decision needs prayer, patience, or wise counsel?", prayer: "Generous God, give me wisdom that is humble, clear, and ready to obey. Amen." },
  { name: "Courage", keywords: ["strong", "courage", "afraid", "bold", "help"], titles: ["Courage for the Next Step", "Strength Beyond Your Own", "Stand with a Steady Heart"], question: "What faithful step have you delayed because of fear?", prayer: "Lord, be my courage. Help me act faithfully without pretending that I am never afraid. Amen." },
  { name: "Endurance", keywords: ["wait", "patience", "endure", "strength", "hope"], titles: ["Grace for the Long Road", "Do Not Grow Weary", "Strength for Today"], question: "Where do you need patient endurance rather than immediate results?", prayer: "God, renew my strength for the work that takes time. Keep me hopeful and faithful. Amen." },
  { name: "Gratitude", keywords: ["thanks", "praise", "bless", "good", "rejoice"], titles: ["Notice the Gift", "Gratitude in the Workday", "A Reason to Give Thanks"], question: "What quiet gift can you notice and thank God for right now?", prayer: "Father, open my eyes to Your goodness and let gratitude shape my words and work. Amen." },
  { name: "Compassion", keywords: ["kind", "mercy", "love", "compassion", "forgive"], titles: ["Make Room for Mercy", "The Person Before the Task", "Grace in Every Conversation"], question: "Who may need patience, mercy, or encouragement from you today?", prayer: "Lord, make me attentive to people, gentle in speech, and generous in mercy. Amen." },
  { name: "Integrity", keywords: ["truth", "upright", "righteous", "honest", "just"], titles: ["Wholehearted Work", "Truth When No One Sees", "The Quiet Strength of Integrity"], question: "Where are you being invited to choose what is right over what is easy?", prayer: "God of truth, make my private choices and public actions honour You. Amen." },
  { name: "Renewal", keywords: ["new", "renew", "restore", "morning", "life"], titles: ["Mercy for a New Beginning", "Restored for the Road Ahead", "Begin Again with Grace"], question: "What weary place in you needs God’s renewing care?", prayer: "Restoring God, renew my mind, restore my joy, and help me begin again with grace. Amen." },
  { name: "Purpose", keywords: ["purpose", "called", "serve", "gift", "fruit"], titles: ["Work with Holy Purpose", "Called into This Day", "More Than a Checklist"], question: "How can your work serve someone beyond yourself today?", prayer: "Lord, give purpose to my effort and help my work become an expression of love. Amen." },
  { name: "Rest", keywords: ["rest", "sleep", "burden", "care", "refuge"], titles: ["You Do Not Carry It Alone", "Permission to Rest", "Held Beyond the Workday"], question: "What burden can you release instead of carrying into your rest?", prayer: "Father, I release what remains unfinished. Hold what I cannot control and teach me to rest. Amen." },
];

const openings = [
  "Before the day gathers speed, let this Scripture create a little room in your thoughts.",
  "A busy day can narrow your attention until only the urgent remains. Scripture gently widens the view.",
  "God often meets us in ordinary moments, including the work that waits in front of us now.",
  "Pause before moving to the next demand. You are more than the list of things you must finish.",
  "This verse offers a steady place to stand while plans, conversations, and pressures continue around you.",
  "The workday has its own noise, but God’s voice does not need to compete with it.",
];

const middles = [
  "Receive these words as an invitation, not another demand. Let them shape the spirit in which you approach the next task and the next person.",
  "Faithfulness is usually formed through small choices: an honest answer, patient attention, careful work, and the humility to ask for help.",
  "You may not control the outcome before you. You can still choose a response rooted in trust, wisdom, and love.",
  "God is present in the unfinished places as surely as in the moments of success. Nothing about this hour is beyond His care.",
  "Let your pace become prayerful enough to notice what matters. Excellence and gentleness do not have to be enemies.",
  "Carry the truth of this verse into one concrete action. A small faithful step can redirect the character of an entire day.",
];

const closings = [
  "Return to your work without rushing past this truth. Let it accompany you quietly.",
  "You do not need to solve the whole day at once. Be faithful in the next clear thing.",
  "Allow God’s character—not the pressure around you—to set the tone for what comes next.",
  "Take one unhurried breath, then continue with a heart made steadier by grace.",
  "May the way you work today leave room for truth, kindness, and the presence of God.",
  "Whatever remains uncertain, you can enter the next moment knowing that you do not enter it alone.",
];

const banned = /\b(slew|slay|harlot|foreskin|concubine|blood|sword|destroy|wrath|vengeance|smite|dead|death|hell)\b/i;
const candidates = [];
for (const book of bible.books) {
  for (const chapter of book.chapters) {
    for (const verse of chapter.verses) {
      const text = verse.text.replace(/\[|\]/g, "");
      const reference = `${book.name} ${chapter.number}:${verse.num}`;
      if (!availableReferences.every((references) => references.has(reference))) continue;
      if (text.length < 45 || text.length > 190 || banned.test(text)) continue;
      const lower = text.toLowerCase();
      const theme = themes
        .map((item) => ({ item, score: item.keywords.filter((keyword) => lower.includes(keyword)).length }))
        .sort((a, b) => b.score - a.score)[0];
      if (!theme || theme.score === 0) continue;
      candidates.push({
        verse: text,
        reference,
        theme: theme.item,
        score: theme.score,
      });
    }
  }
}

candidates.sort((a, b) => b.score - a.score || a.reference.localeCompare(b.reference));
const selected = [];
const seenReferences = new Set();
const perBook = new Map();
for (const candidate of candidates) {
  const book = candidate.reference.replace(/\s+\d+:\d+$/, "");
  if ((perBook.get(book) || 0) >= 10 || seenReferences.has(candidate.reference)) continue;
  selected.push(candidate);
  seenReferences.add(candidate.reference);
  perBook.set(book, (perBook.get(book) || 0) + 1);
  if (selected.length === 366) break;
}
if (selected.length < 366) throw new Error(`Only found ${selected.length} suitable unique verses.`);

const dates = [];
const leapYear = 2024;
for (let month = 0; month < 12; month += 1) {
  const days = new Date(leapYear, month + 1, 0).getDate();
  for (let day = 1; day <= days; day += 1) {
    dates.push(`${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`);
  }
}

const devotionals = dates.map((id, index) => {
  const source = selected[index];
  const themeIndex = themes.indexOf(source.theme);
  const title = `${source.theme.titles[index % source.theme.titles.length]} · ${String(index + 1).padStart(3, "0")}`;
  return {
    id,
    dayNumber: index + 1,
    theme: source.theme.name,
    verse: source.verse,
    reference: source.reference,
    title,
    reflection: [
      openings[index % openings.length],
      middles[(index + themeIndex) % middles.length],
      closings[(index * 5 + themeIndex) % closings.length],
    ],
    prompt: source.theme.question,
    prayer: source.theme.prayer,
    image: `${id}.webp`,
    attribution: "Original reflection by Work Day with God",
  };
});

fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, JSON.stringify({ version: 1, translation: "KJV", devotionals }, null, 2));
console.log(`Wrote ${devotionals.length} devotionals to ${output}`);
