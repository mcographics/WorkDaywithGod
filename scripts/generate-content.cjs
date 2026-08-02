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

// Daily anchors are intentionally drawn from pastoral, hope-filled portions of
// Scripture. This is a devotional catalogue, not a whole-Bible reading plan;
// passages centred on judgment, violence, or distress belong in their wider
// context and should not be surfaced here as isolated encouragement.
const newTestamentBooks = new Set([
  "Matthew", "Mark", "Luke", "John", "Acts", "Romans", "1 Corinthians",
  "2 Corinthians", "Galatians", "Ephesians", "Philippians", "Colossians",
  "1 Thessalonians", "2 Thessalonians", "1 Timothy", "2 Timothy", "Titus",
  "Philemon", "Hebrews", "James", "1 Peter", "2 Peter", "1 John", "2 John",
  "3 John", "Jude", "Revelation",
]);

const encouragingOldTestamentChapters = new Map([
  ["Psalms", new Set([16, 18, 19, 23, 27, 29, 30, 31, 32, 33, 34, 36, 37, 40, 42, 43, 46, 47, 48, 55, 56, 57, 61, 62, 63, 65, 67, 68, 71, 73, 84, 85, 86, 89, 90, 91, 92, 95, 96, 98, 100, 103, 104, 105, 107, 111, 112, 115, 116, 117, 118, 119, 121, 122, 125, 126, 127, 128, 130, 133, 134, 136, 138, 139, 143, 145, 146, 147, 148, 149, 150])],
  ["Proverbs", new Set([2, 3, 4, 8, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 24, 25, 27, 28, 29, 30, 31])],
  ["Isaiah", new Set([9, 11, 12, 25, 26, 30, 32, 35, 40, 41, 42, 43, 44, 49, 51, 52, 54, 55, 57, 58, 60, 61, 62, 65, 66])],
  ["Jeremiah", new Set([17, 29, 31, 32, 33])],
  ["Lamentations", new Set([3])],
  ["Micah", new Set([6, 7])],
  ["Zephaniah", new Set([3])],
  ["Zechariah", new Set([8, 9])],
]);

const unsuitableDailyAnchor = /\b(?:smit\w*|smote|slay\w*|slain|slew|kill\w*|murder\w*|destr\w*|wrath|venge\w*|damn\w*|condemn\w*|punish\w*|curs\w*|accursed|sword|blood|hell|wicked\w*|evil|iniquit\w*|transgress\w*|sins?|sinners?|death|deaths|dead|die|dieth|dying|perish\w*|judg\w*|enemies|enemy|war|battle|terror|harlot|whore\w*|fornicat\w*|adulter\w*|drunken\w*|strong drink|idol\w*|belial|afflict\w*|tribulat\w*|persecut\w*|suffer\w*|sorrow\w*|grief|griev\w*|weep\w*|mourn\w*|betray\w*|crucif\w*|devil\w*|fool\w*|hate\w*|reproach\w*|stripes|prisons?|prisoner\w*|captiv\w*|contention|anger|angry|sham\w*|confusion|infirm\w*|sick\w*|diseases?|palsy|crying|rebuk\w*|rod|despis\w*|offen[cs]\w*|circumcision|loins|miserable|anathema|aliens?|strangers?|removed|lose|lost|deceiv\w*|wanton|boast\w*|false|scorn\w*|bind|pharaoh|egypt\w*|scatter\w*|whirlwind|graven|weari\w*|violence|wasting|bruise|satan|hardness|soldier|beaten|unlearned|ignorant|accus\w*|corrupt\w*|reprobat\w*|darken\w*|alienat\w*|ignorance|blindness|beware|scribes?|lies?|worshipped|creatures?|broken|wither\w*|fall\w*|schoolmaster|unknown|heathen|bowels|profane|babblings?|oppositions?|shipwreck|forbid\w*|abstain\w*|fight\w*|err\w*|overthrow\w*|lest|pitiful|armed|unjust\w*|plague|harden\w*|disobedient|trodden|dunghill|terrible|ass|woe)\b/i;
// Mentioning Jesus is not, by itself, proof that an isolated verse is suitable;
// the verse must also carry an affirmative pastoral signal of its own.
const encouragingLanguage = /\b(?:grace|peace|love|lovingkindness|hope|joy|rejoice|comfort|bless|blessed|blessing|mercy|merciful|goodness|kindness|faith|faithful|trust|strength|strong|help|helper|rest|life|light|truth|wisdom|understanding|counsel|forgive|forgiven|salvation|saved|saviour|redeem|renew|restore|refuge|shepherd|pray|prayer|thanks|thanksgiving|praise|glory|gift|fruit|serve|patience|endure|gentle|humble|promise)\b/gi;
const contextDependentReferences = new Set([
  "1 Thessalonians 2:6",
  "2 Thessalonians 1:7",
  "John 1:42",
  "Luke 10:41",
  "Jeremiah 32:19",
  "Psalms 105:22",
  "2 Corinthians 11:18",
  "2 Corinthians 12:15",
  "Isaiah 41:21",
  "Isaiah 43:4",
  "John 12:43",
  "Zechariah 9:1",
]);
const contextDependentContrast = /\b(?:not|no|neither|nor|without|against|but|if)\b/i;

const themes = [
  { name: "Surrender", keywords: ["commit", "trust", "way", "will", "purpose"], titles: ["Place It in His Hands", "The Grace of Letting Go", "A Surrendered Beginning"], question: "What can you place into Jesus’ hands today?", prayer: "Lord Jesus, receive my plans and guide my steps. Help me work with trust instead of control. Amen." },
  { name: "Peace", keywords: ["peace", "quiet", "still", "rest", "fear not"], titles: ["A Quiet Centre", "Peace for This Moment", "Stillness Before the Next Step"], question: "Where do you need Christ’s peace to steady you today?", prayer: "Jesus, Prince of Peace, quiet what is anxious in me and make me attentive to Your presence. Amen." },
  { name: "Faithfulness", keywords: ["faithful", "diligent", "work", "labour"], titles: ["Faithful in the Ordinary", "The Work Before You", "A Steady and Willing Heart"], question: "What ordinary responsibility can you offer to Christ with greater care?", prayer: "Lord Jesus, make me faithful in small things and sincere in every responsibility You give me. Amen." },
  { name: "Wisdom", keywords: ["wisdom", "understanding", "knowledge", "teach", "counsel"], titles: ["Wisdom for the Way", "Before You Answer", "A Heart Willing to Learn"], question: "Which decision can you bring to Jesus for wisdom today?", prayer: "Christ, our wisdom, give me a heart that is humble, clear, and ready to follow You. Amen." },
  { name: "Courage", keywords: ["strong", "courage", "afraid", "bold", "help"], titles: ["Courage for the Next Step", "Strength Beyond Your Own", "Stand with a Steady Heart"], question: "What faithful step can you take with Jesus beside you?", prayer: "Lord Jesus, be my courage. Help me act faithfully, knowing that I do not walk alone. Amen." },
  { name: "Endurance", keywords: ["wait", "patience", "endure", "strength", "hope"], titles: ["Grace for the Long Road", "Do Not Grow Weary", "Strength for Today"], question: "Where do you need Christ’s patient strength today?", prayer: "Jesus, renew my strength for the work that takes time. Keep me hopeful and faithful. Amen." },
  { name: "Gratitude", keywords: ["thanks", "praise", "bless", "good", "rejoice"], titles: ["Notice the Gift", "Gratitude in the Workday", "A Reason to Give Thanks"], question: "What gift of Christ’s grace can you give thanks for right now?", prayer: "Lord Jesus, open my eyes to Your goodness and let gratitude shape my words and work. Amen." },
  { name: "Compassion", keywords: ["kind", "mercy", "love", "compassion", "forgive"], titles: ["Make Room for Mercy", "The Person Before the Task", "Grace in Every Conversation"], question: "Who can receive the kindness of Christ through you today?", prayer: "Jesus, make me attentive to people, gentle in speech, and generous with the mercy You have shown me. Amen." },
  { name: "Integrity", keywords: ["truth", "upright", "righteous", "honest", "just"], titles: ["Wholehearted Work", "Truth When No One Sees", "The Quiet Strength of Integrity"], question: "Where is Jesus inviting you to choose what is right over what is easy?", prayer: "Lord Jesus, make my private choices and public actions honour You. Amen." },
  { name: "Renewal", keywords: ["new", "renew", "restore", "morning", "life"], titles: ["Mercy for a New Beginning", "Restored for the Road Ahead", "Begin Again with Grace"], question: "What weary place can you bring to Christ’s renewing care?", prayer: "Jesus, renew my mind, restore my joy, and help me begin again in Your grace. Amen." },
  { name: "Purpose", keywords: ["purpose", "called", "serve", "gift", "fruit"], titles: ["Work with Holy Purpose", "Called into This Day", "More Than a Checklist"], question: "How can your work reflect the love of Jesus today?", prayer: "Lord Jesus, give purpose to my effort and let my work become an expression of Your love. Amen." },
  { name: "Rest", keywords: ["rest", "sleep", "burden", "care", "refuge"], titles: ["You Do Not Carry It Alone", "Permission to Rest", "Held Beyond the Workday"], question: "What burden can you release into Jesus’ care?", prayer: "Jesus, I release what remains unfinished. Hold what I cannot control and teach me to rest in You. Amen." },
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
  "Receive these words in the light of Jesus, whose grace invites rather than burdens you. Let His love shape the next task and the next person you meet.",
  "Jesus forms faithfulness through small choices: an honest answer, patient attention, careful work, and the humility to ask for help.",
  "You may not control the outcome before you, but Christ is with you. Choose a response rooted in His trust, wisdom, and love.",
  "Jesus is present in unfinished places as surely as in moments of success. Nothing about this hour is beyond His care.",
  "Let Christ set a prayerful pace for you today. In His hands, excellence and gentleness can grow together.",
  "Carry this truth into one concrete action with Jesus. A small faithful step can redirect the character of an entire day.",
];

const closings = [
  "Return to your work without rushing past this truth. Let it accompany you quietly.",
  "You do not need to solve the whole day at once. Be faithful in the next clear thing.",
  "Allow God’s character—not the pressure around you—to set the tone for what comes next.",
  "Take one unhurried breath, then continue with a heart made steadier by grace.",
  "May the way you work today leave room for truth, kindness, and the presence of God.",
  "Whatever remains uncertain, you can enter the next moment knowing that you do not enter it alone.",
];

const candidates = [];
for (const book of bible.books) {
  const isNewTestament = newTestamentBooks.has(book.name);
  const approvedOldTestamentChapters = encouragingOldTestamentChapters.get(book.name);
  if (!isNewTestament && !approvedOldTestamentChapters) continue;
  for (const chapter of book.chapters) {
    if (!isNewTestament && !approvedOldTestamentChapters.has(chapter.number)) continue;
    if (book.name === "Revelation" && ![1, 3, 21, 22].includes(chapter.number)) continue;
    for (const verse of chapter.verses) {
      const text = verse.text.replace(/\[|\]/g, "");
      const reference = `${book.name} ${chapter.number}:${verse.num}`;
      if (!availableReferences.every((references) => references.has(reference))) continue;
      if (contextDependentReferences.has(reference)) continue;
      // Standalone rhetorical questions are often dependent on surrounding
      // verses and can sound accusatory or confusing on a compact Verse Card.
      if (
        text.length < 45
        || text.length > 190
        || text.includes("?")
        || contextDependentContrast.test(text)
        || unsuitableDailyAnchor.test(text)
      ) continue;
      const encouragementMatches = text.match(encouragingLanguage) || [];
      if (encouragementMatches.length === 0) continue;
      const lower = text.toLowerCase();
      const theme = themes
        .map((item) => ({ item, score: item.keywords.filter((keyword) => lower.includes(keyword)).length }))
        .sort((a, b) => b.score - a.score)[0];
      if (!theme || theme.score === 0) continue;
      candidates.push({
        verse: text,
        reference,
        theme: theme.item,
        score: (theme.score * 4) + (encouragementMatches.length * 2) + (/\b(?:Jesus|Christ|Saviour|gospel)\b/i.test(text) ? 6 : 0),
        testament: isNewTestament ? "NT" : "OT",
      });
    }
  }
}

candidates.sort((a, b) => b.score - a.score || a.reference.localeCompare(b.reference));
const selected = [];
const seenReferences = new Set();
const selectAnchors = (testament, target, perBookLimit) => {
  const perBook = new Map();
  for (const candidate of candidates) {
    if (candidate.testament !== testament || seenReferences.has(candidate.reference)) continue;
    const book = candidate.reference.replace(/\s+\d+:\d+$/, "");
    if ((perBook.get(book) || 0) >= perBookLimit) continue;
    selected.push(candidate);
    seenReferences.add(candidate.reference);
    perBook.set(book, (perBook.get(book) || 0) + 1);
    if ([...selected].filter((item) => item.testament === testament).length === target) break;
  }
};

// Keep the catalogue explicitly Christ-centred: roughly three quarters of the
// daily anchors come from the New Testament, while gentle OT promises remain.
selectAnchors("NT", 270, 25);
selectAnchors("OT", 96, 32);
if (selected.length < 366) throw new Error(`Only found ${selected.length} suitable unique verses.`);

// Preserve a varied calendar instead of placing the OT and NT groups in blocks.
selected.sort((a, b) => b.score - a.score || a.reference.localeCompare(b.reference));

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
fs.writeFileSync(output, JSON.stringify({ version: 2, translation: "KJV", devotionals }, null, 2));
console.log(`Wrote ${devotionals.length} devotionals to ${output}`);
