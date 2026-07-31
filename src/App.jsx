import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft, ArrowRight, Bell, BookOpen, CalendarDays, Check, ChevronLeft, ChevronRight,
  Clock3, Heart, History, Minus, Pause, Play, RotateCcw, Settings, SlidersHorizontal, X,
} from "lucide-react";
import { calculateStreak, dateId, devotionalForDate, isoDate, loadCatalogue } from "./catalogue";
import { getChapter, translations } from "./scripture";

const defaultSettings = {
  launchAtLogin: true, closeToTray: true, showStartupCard: true, startInTray: false,
  notificationsEnabled: true, notificationSound: false, remindLaterMinutes: 60, reminderMode: "times",
  reminderTimes: ["09:00", "12:00", "15:00", "17:00"], intervalMinutes: 60,
  activeDays: [1, 2, 3, 4, 5], quietHours: { enabled: true, start: "18:00", end: "08:00" },
  theme: "gold", colorMode: "system", imageOverlay: 38, imageTransition: true,
  focusMode: false, fontScale: 1, scriptureFontScale: 1, reducedMotion: false,
  autoScrollEnabled: true, autoScrollSpeed: 2, hoverPausesScroll: true,
  rememberReadingPosition: true, showReflectionPrompt: true, showPrayer: true, showAttribution: true,
  automaticDailyContent: true, automaticDailyImage: true, preventFutureDevotionals: false, showStreak: true,
  translation: "KJV",
};
const browserState = { settings: defaultSettings, favourites: [], completions: {}, readingPositions: {}, snoozeUntil: 0, migrationComplete: true };
const desktop = window.desktop || {
  minimize() {}, close() {}, setMode() {},
  getState: async () => browserState,
  updateSettings: async (patch) => ({ ...browserState, settings: { ...defaultSettings, ...patch } }),
  updateState: async (patch) => ({ ...browserState, ...patch }),
  migrateLegacy: async () => browserState,
  snooze: async () => ({}),
  testNotification: async () => ({ supported: false }), openDataFolder: async () => "",
  exportData: async () => ({ canceled: true }), importData: async () => ({ canceled: true }),
  resetHistory: async () => browserState, resetFavourites: async () => browserState, resetAll: async () => browserState,
  getAppInfo: async () => ({ version: "1.0.0", notificationSupported: false }),
  onNavigate: () => () => {}, onOpenDate: () => () => {}, onStateChanged: () => () => {},
};

function WindowControls() {
  return <div className="window-controls">
    <button aria-label="Minimize" onClick={desktop.minimize}><Minus size={16} /></button>
    <button aria-label="Close to tray" onClick={desktop.close}><X size={16} /></button>
  </div>;
}

function Card({ devotional, favourite, streak, onFavourite, onRead, onSnooze, settings }) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  return <main className={`compact-shell accent-${settings.theme} ${settings.focusMode ? "focus-mode" : ""}`}>
    {!settings.focusMode && <div className={`photo-layer ${settings.imageTransition ? "" : "no-transition"}`} style={{ backgroundImage: `url("./scenes/${settings.automaticDailyImage ? devotional.image : "01-01.webp"}")` }} />}
    <div className="card-shade" style={{ "--overlay": settings.imageOverlay / 100 }} />
    <div className="drag-bar"><div className="brand-mark"><span>WORK DAY</span><em>with God</em></div><WindowControls /></div>
    <section className="verse-card">
      <div className="eyebrow"><span className="eyebrow-line" />{greeting}</div>
      <blockquote>“{devotional.verse}”</blockquote>
      <p className="reference">{devotional.reference} <span>KJV</span></p>
      <button className="read-button" onClick={onRead}>Read today’s reflection <ChevronRight size={18} /></button>
    </section>
    <footer className="compact-footer">
      <div><span className="status-dot" /> {settings.showStreak && streak ? `${streak}-day reading streak` : "A quiet reminder for your day"}</div>
      <div className="footer-actions">
        <button className={favourite ? "active" : ""} onClick={onFavourite} aria-label="Favourite"><Heart size={17} fill={favourite ? "currentColor" : "none"} /></button>
        <button aria-label="Remind me in one hour" onClick={onSnooze}><Clock3 size={17} /></button>
        <button aria-label="Settings" onClick={() => onRead("settings")}><SlidersHorizontal size={17} /></button>
      </div>
    </footer>
  </main>;
}

function ScriptureDrawer({ reference, translation, scriptureFontScale, onTranslation, onClose }) {
  const [chapter, setChapter] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    setChapter(null); setError("");
    getChapter(reference, translation).then(setChapter).catch((reason) => setError(reason.message));
  }, [reference, translation]);
  return <div className="scripture-backdrop" onClick={onClose}>
    <aside className="scripture-drawer" style={{ "--scripture-scale": scriptureFontScale }} onClick={(event) => event.stopPropagation()}>
      <div className="scripture-header">
        <div><span>Local Scripture library</span><h2>{chapter ? `${chapter.book} ${chapter.chapter}` : "Scripture"}</h2></div>
        <button aria-label="Close Scripture" onClick={onClose}><X size={19} /></button>
      </div>
      <label className="translation-select"><span>Translation</span>
        <select value={translation} onChange={(event) => onTranslation(event.target.value)}>
          {translations.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
        </select>
      </label>
      {error && <p className="scripture-error">{error}</p>}
      {chapter && <div className="chapter-text">
        {chapter.verses.map((verse) => <p key={verse.num} className={verse.num === chapter.selectedVerse ? "selected-verse" : ""}><sup>{verse.num}</sup>{verse.text}</p>)}
        <div className="translation-note">{translations.find((item) => item.id === translation)?.label} · Stored locally</div>
      </div>}
    </aside>
  </div>;
}

function ReadingView({ devotional, selectedDate, settings, appState, onBack, onSettings, onPatchSettings, onPatchState, onToggleFavourite, onToggleComplete, onSelectDate }) {
  const [scrolling, setScrolling] = useState(false);
  const [hoverPaused, setHoverPaused] = useState(false);
  const [scriptureOpen, setScriptureOpen] = useState(false);
  const scrollRef = useRef(null);
  const favourite = appState.favourites.includes(devotional.id);
  const completed = Boolean(appState.completions[selectedDate]);

  useEffect(() => {
    if (!scrolling || hoverPaused) return;
    const timer = setInterval(() => {
      const node = scrollRef.current;
      if (!node) return;
      node.scrollTop += settings.autoScrollSpeed * 0.32;
      if (node.scrollTop + node.clientHeight >= node.scrollHeight - 2) setScrolling(false);
    }, 20);
    return () => clearInterval(timer);
  }, [scrolling, hoverPaused, settings.autoScrollSpeed]);
  useEffect(() => {
    const node = scrollRef.current;
    if (node && settings.rememberReadingPosition) node.scrollTop = Number(appState.readingPositions?.[selectedDate]) || 0;
    return () => {
      if (node && settings.rememberReadingPosition) {
        onPatchState({ readingPositions: { ...(appState.readingPositions || {}), [selectedDate]: node.scrollTop } });
      }
    };
  }, [selectedDate]);

  const adjacent = (direction) => {
    const next = new Date(`${selectedDate}T12:00:00`);
    next.setDate(next.getDate() + direction);
    if (settings.preventFutureDevotionals && next > new Date()) return;
    onSelectDate(next);
  };

  return <div className="reader-layout">
    <aside className="reader-aside">
      <button className="back-link" onClick={onBack}><ArrowLeft size={16} /> Verse card</button>
      <div className="today-label">{new Date(`${selectedDate}T12:00:00`).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}</div>
      <h1>{devotional.title.replace(/\s·\s\d+$/, "")}</h1>
      <div className="aside-verse">“{devotional.verse}”<strong>{devotional.reference}</strong></div>
      <button className="scripture-link" onClick={() => setScriptureOpen(true)}><BookOpen size={15} /> Read the full chapter</button>
      <div className="day-nav"><button onClick={() => adjacent(-1)}><ArrowLeft size={16} /></button><span>Day {devotional.dayNumber} of 366</span><button onClick={() => adjacent(1)}><ArrowRight size={16} /></button></div>
      <button className={`complete-button ${completed ? "done" : ""}`} onClick={onToggleComplete}>{completed ? <><Check size={17} /> Reading completed</> : "Mark as complete"}</button>
    </aside>
    <article className="reflection" ref={scrollRef} style={{ "--font-scale": settings.fontScale }}
      onMouseEnter={() => settings.hoverPausesScroll && setHoverPaused(true)}
      onMouseLeave={() => setHoverPaused(false)}>
      <div className="article-kicker">{devotional.theme} · A workday reflection</div>
      {devotional.reflection.map((paragraph, index) => <p key={index} className={index === 0 ? "lead" : ""}>{paragraph}</p>)}
      {settings.showReflectionPrompt && <section className="reflection-prompt"><span>Pause & reflect</span><h2>{devotional.prompt}</h2></section>}
      {settings.showPrayer && <section className="prayer"><span>A prayer for today</span><p>{devotional.prayer}</p></section>}
      {settings.showAttribution && <div className="article-end">{devotional.attribution}</div>}
    </article>
    <div className="reading-tools">
      <button className={favourite ? "active" : ""} onClick={onToggleFavourite} title="Favourite"><Heart size={18} fill={favourite ? "currentColor" : "none"} /></button>
      <div className="divider" />
      <button onClick={() => onPatchSettings({ fontScale: Math.max(.8, settings.fontScale - .1) })}>A−</button>
      <button onClick={() => onPatchSettings({ fontScale: Math.min(1.4, settings.fontScale + .1) })}>A+</button>
      <div className="divider" />
      <button disabled={!settings.autoScrollEnabled || settings.reducedMotion} onClick={() => setScrolling(!scrolling)} title="Auto-scroll">{scrolling ? <Pause size={18} /> : <Play size={18} />}</button>
      <button onClick={() => { setScrolling(false); scrollRef.current.scrollTop = 0; }} title="Restart"><RotateCcw size={17} /></button>
      <button onClick={onSettings} title="Reading settings"><Settings size={17} /></button>
    </div>
    {scriptureOpen && <ScriptureDrawer reference={devotional.reference} translation={settings.translation} scriptureFontScale={settings.scriptureFontScale} onTranslation={(translation) => onPatchSettings({ translation })} onClose={() => setScriptureOpen(false)} />}
  </div>;
}

function CalendarView({ catalogue, appState, settings, onSelectDate }) {
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const firstOffset = month.getDay();
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells = [...Array(firstOffset).fill(null), ...Array.from({ length: days }, (_, index) => index + 1)];
  return <section className="panel-view calendar-view">
    <div className="panel-heading calendar-heading"><div><span>Your journey</span><h1>Reading history</h1><p>{calculateStreak(appState.completions)}-day current streak · {Object.keys(appState.completions).length} readings completed</p></div>
      <div className="month-nav"><button onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}><ChevronLeft /></button><strong>{month.toLocaleDateString(undefined, { month: "long", year: "numeric" })}</strong><button onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}><ChevronRight /></button></div>
    </div>
    <div className="calendar-grid">{["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((day) => <div className="weekday" key={day}>{day}</div>)}
      {cells.map((day, index) => {
        if (!day) return <div key={`empty-${index}`} />;
        const date = new Date(month.getFullYear(), month.getMonth(), day, 12);
        const item = devotionalForDate(catalogue, date);
        const key = isoDate(date);
        const future = settings.preventFutureDevotionals && date > new Date();
        return <button key={key} disabled={future} className={`${appState.completions[key] ? "completed-day" : ""} ${key === isoDate() ? "current-day" : ""}`} onClick={() => !future && onSelectDate(date)}>
          <span>{day}</span><small>{item.theme}</small>{appState.favourites.includes(item.id) && <Heart size={12} fill="currentColor" />}{appState.completions[key] && <Check size={13} />}
        </button>;
      })}
    </div>
  </section>;
}

function Toggle({ checked, onChange, label }) {
  return <button className={`toggle ${checked ? "on" : ""}`} role="switch" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)}><span /></button>;
}

function SettingsView({ settings, appState, onPatchSettings, onSnooze, onPatchState }) {
  const [message, setMessage] = useState("");
  const [appInfo, setAppInfo] = useState(null);
  useEffect(() => { desktop.getAppInfo().then(setAppInfo); }, []);
  const run = async (action, success) => {
    try {
      const result = await action();
      if (result?.state) onPatchState(result.state, true);
      setMessage(result?.canceled ? "Action cancelled." : success);
    } catch (error) { setMessage(error.message); }
  };
  const updateQuiet = (patch) => onPatchSettings({ quietHours: { ...settings.quietHours, ...patch } });
  const toggleDay = (day) => onPatchSettings({ activeDays: settings.activeDays.includes(day) ? settings.activeDays.filter((value) => value !== day) : [...settings.activeDays, day].sort() });
  const updateTime = (index, value) => onPatchSettings({ reminderTimes: settings.reminderTimes.map((time, itemIndex) => itemIndex === index ? value : time).sort() });
  const paused = appState.snoozeUntil > Date.now();
  return <section className="panel-view settings-view">
    <div className="panel-heading"><span>Make it yours</span><h1>Settings</h1><p>Everything is stored locally on this computer.</p></div>
    <div className="settings-sections">
      <div className="settings-group"><h2>Startup & tray</h2>
        <div className="setting-row"><div><h3>Launch at login</h3><p>Open today’s card when you sign in to Windows.</p></div><Toggle label="Launch at login" checked={settings.launchAtLogin} onChange={(launchAtLogin) => onPatchSettings({ launchAtLogin })} /></div>
        <div className="setting-row"><div><h3>Show card at startup</h3><p>Display today’s verse after Windows login.</p></div><Toggle label="Show card at startup" checked={settings.showStartupCard} onChange={(showStartupCard) => onPatchSettings({ showStartupCard })} /></div>
        <div className="setting-row"><div><h3>Start silently in tray</h3><p>Keep the startup card hidden while reminders remain active.</p></div><Toggle label="Start in tray" checked={settings.startInTray} onChange={(startInTray) => onPatchSettings({ startInTray })} /></div>
      </div>
      <div className="settings-group"><h2>Gentle reminders</h2>
        <div className="setting-row"><div><h3>Notifications</h3><p>Master switch for all scheduled reminders.</p></div><Toggle label="Notifications" checked={settings.notificationsEnabled} onChange={(notificationsEnabled) => onPatchSettings({ notificationsEnabled })} /></div>
        <div className="setting-row"><div><h3>Notification sound</h3><p>Allow Windows to play its notification sound.</p></div><Toggle label="Notification sound" checked={settings.notificationSound} onChange={(notificationSound) => onPatchSettings({ notificationSound })} /></div>
        <div className="setting-row stack"><div><h3>Schedule style</h3></div><div className="segmented"><button className={settings.reminderMode === "times" ? "selected" : ""} onClick={() => onPatchSettings({ reminderMode: "times" })}>Specific times</button><button className={settings.reminderMode === "interval" ? "selected" : ""} onClick={() => onPatchSettings({ reminderMode: "interval" })}>Interval</button></div></div>
        {settings.reminderMode === "times" ? <div className="time-list">{settings.reminderTimes.map((time, index) => <label key={`${time}-${index}`}><input type="time" value={time} onChange={(event) => updateTime(index, event.target.value)} /><button aria-label={`Remove ${time}`} onClick={() => onPatchSettings({ reminderTimes: settings.reminderTimes.filter((_, itemIndex) => itemIndex !== index) })}><X size={12} /></button></label>)}<button onClick={() => onPatchSettings({ reminderTimes: [...settings.reminderTimes, "10:00"].sort() })}>+ Add time</button></div>
          : <label className="field-label">Every <span className="number-field"><input type="number" min="15" max="720" step="5" value={settings.intervalMinutes} onChange={(event) => onPatchSettings({ intervalMinutes: Number(event.target.value) })} /> minutes</span></label>}
        <div className="weekday-picker">{["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((label, day) => <button key={label} className={settings.activeDays.includes(day) ? "selected" : ""} onClick={() => toggleDay(day)}>{label}</button>)}</div>
        <div className="setting-row"><div><h3>Quiet hours</h3><p>No notifications during this period.</p></div><Toggle label="Quiet hours" checked={settings.quietHours.enabled} onChange={(enabled) => updateQuiet({ enabled })} /></div>
        {settings.quietHours.enabled && <div className="quiet-times"><input type="time" value={settings.quietHours.start} onChange={(event) => updateQuiet({ start: event.target.value })} /><span>to</span><input type="time" value={settings.quietHours.end} onChange={(event) => updateQuiet({ end: event.target.value })} /></div>}
        <div className="snooze-row"><Bell size={18} /><span>{paused ? `Paused until ${new Date(appState.snoozeUntil).toLocaleString()}` : "Reminders are active"}</span>{paused ? <button onClick={() => onSnooze(0)}>Resume</button> : <><button onClick={() => onSnooze(Date.now() + 60 * 60 * 1000)}>Pause 1 hour</button><button onClick={() => { const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1); tomorrow.setHours(0,0,0,0); onSnooze(tomorrow.getTime()); }}>Until tomorrow</button></>}</div>
        <label className="field-label">“Remind me later” duration <span className="number-field"><input type="number" min="5" max="1440" value={settings.remindLaterMinutes} onChange={(event) => onPatchSettings({ remindLaterMinutes: Number(event.target.value) })} /> minutes</span></label>
        <div className="action-row"><button onClick={() => run(() => desktop.testNotification(), "Test notification sent.")}>Send test notification</button></div>
      </div>
      <div className="settings-group"><h2>Appearance & reading</h2>
        <div className="theme-options expanded">{["gold","blue","forest","burgundy","lavender","terracotta","sage","rose","teal","charcoal"].map((theme) => <button key={theme} className={settings.theme === theme ? "chosen" : ""} onClick={() => onPatchSettings({ theme })}><i className={theme} />{theme}</button>)}</div>
        <label className="field-label">Colour mode <select value={settings.colorMode} onChange={(event) => onPatchSettings({ colorMode: event.target.value })}><option value="system">Follow Windows</option><option value="light">Light</option><option value="dark">Dark</option></select></label>
        <label className="field-label">Bible translation <select value={settings.translation} onChange={(event) => onPatchSettings({ translation: event.target.value })}>{translations.map((item) => <option value={item.id} key={item.id}>{item.label}</option>)}</select></label>
        <label className="range-field"><span>Text size</span><input type="range" min=".8" max="1.4" step=".05" value={settings.fontScale} onChange={(event) => onPatchSettings({ fontScale: Number(event.target.value) })} /></label>
        <label className="range-field"><span>Scripture text size</span><input type="range" min=".8" max="1.4" step=".05" value={settings.scriptureFontScale} onChange={(event) => onPatchSettings({ scriptureFontScale: Number(event.target.value) })} /></label>
        <label className="range-field"><span>Auto-scroll speed</span><input type="range" min="1" max="4" step="1" value={settings.autoScrollSpeed} onChange={(event) => onPatchSettings({ autoScrollSpeed: Number(event.target.value) })} /></label>
        {[["focusMode","Image-free focus mode"],["reducedMotion","Reduced motion"],["autoScrollEnabled","Auto-scroll"],["hoverPausesScroll","Pause auto-scroll while hovering"],["rememberReadingPosition","Remember reading position"],["showReflectionPrompt","Show reflection question"],["showPrayer","Show closing prayer"],["showAttribution","Show attribution"]].map(([key, label]) => <div className="setting-row compact" key={key}><div><h3>{label}</h3></div><Toggle label={label} checked={settings[key]} onChange={(value) => onPatchSettings({ [key]: value })} /></div>)}
      </div>
      <div className="settings-group"><h2>Daily content & scenic images</h2>
        {[["automaticDailyContent","Change devotional each day"],["automaticDailyImage","Change scenic image each day"],["imageTransition","Scenic image transition"],["preventFutureDevotionals","Hide future devotionals"],["showStreak","Show reading streak"]].map(([key,label]) => <div className="setting-row compact" key={key}><div><h3>{label}</h3></div><Toggle label={label} checked={settings[key]} onChange={(value) => onPatchSettings({ [key]: value })} /></div>)}
        <label className="range-field"><span>Image darkness</span><input type="range" min="10" max="75" value={settings.imageOverlay} onChange={(event) => onPatchSettings({ imageOverlay: Number(event.target.value) })} /></label>
      </div>
      <div className="settings-group"><h2>History & personal data</h2>
        <div className="action-row"><button onClick={() => run(async () => ({ state: await desktop.resetHistory() }), "Reading history cleared.")}>Clear reading history</button><button onClick={() => run(async () => ({ state: await desktop.resetFavourites() }), "Favourites cleared.")}>Clear favourites</button></div>
        <div className="action-row"><button onClick={() => run(() => desktop.openDataFolder(), "Local data folder opened.")}>Open data folder</button><button onClick={() => run(() => desktop.exportData(), "Backup exported.")}>Export backup</button><button onClick={() => run(() => desktop.importData(), "Backup imported.")}>Import backup</button></div>
        <div className="action-row danger"><button onClick={() => window.confirm("Reset all Work Day with God settings and history?") && run(async () => ({ state: await desktop.resetAll() }), "Application reset.")}>Reset entire application</button></div>
      </div>
      <div className="settings-group"><h2>About</h2><div className="about-row"><span>Work Day with God {appInfo?.version}</span><span>Notifications: {appInfo?.notificationSupported ? "supported" : "unavailable"}</span></div></div>
      {message && <div className="settings-message" role="status">{message}</div>}
    </div>
  </section>;
}

function Reader({ catalogue, devotional, selectedDate, settings, appState, initialView, onBack, onSelectDate, onPatchSettings, onPatchState, onSnooze }) {
  const [view, setView] = useState(initialView || "today");
  useEffect(() => setView(initialView || "today"), [initialView]);
  const favourite = appState.favourites.includes(devotional.id);
  const toggleFavourite = () => onPatchState({ favourites: favourite ? appState.favourites.filter((id) => id !== devotional.id) : [...appState.favourites, devotional.id] });
  const toggleComplete = () => {
    const completions = { ...appState.completions };
    if (completions[selectedDate]) delete completions[selectedDate];
    else completions[selectedDate] = Date.now();
    onPatchState({ completions });
  };
  return <main className={`reader-shell theme-${settings.theme} accent-${settings.theme} mode-${settings.colorMode} ${settings.reducedMotion ? "reduced-motion" : ""}`}>
    <header className="reader-header">
      <button className="wordmark" onClick={onBack}><span>WORK DAY</span><em>with God</em></button>
      <nav>
        <button className={view === "today" ? "selected" : ""} onClick={() => setView("today")}><BookOpen size={16} /> Today</button>
        <button className={view === "history" ? "selected" : ""} onClick={() => setView("history")}><History size={16} /> History</button>
        <button className={view === "settings" ? "selected" : ""} onClick={() => setView("settings")}><Settings size={16} /> Settings</button>
      </nav><WindowControls />
    </header>
    {view === "today" && <ReadingView devotional={devotional} selectedDate={selectedDate} settings={settings} appState={appState} onBack={onBack} onSettings={() => setView("settings")} onPatchSettings={onPatchSettings} onPatchState={onPatchState} onToggleFavourite={toggleFavourite} onToggleComplete={toggleComplete} onSelectDate={onSelectDate} />}
    {view === "history" && <CalendarView catalogue={catalogue} appState={appState} settings={settings} onSelectDate={(date) => { onSelectDate(date); setView("today"); }} />}
    {view === "settings" && <SettingsView settings={settings} appState={appState} onPatchSettings={onPatchSettings} onSnooze={onSnooze} onPatchState={onPatchState} />}
  </main>;
}

export default function App() {
  const [catalogue, setCatalogue] = useState([]);
  const [appState, setAppState] = useState(null);
  const [mode, setMode] = useState("card");
  const [readerView, setReaderView] = useState("today");
  const [selectedDate, setSelectedDate] = useState(() => isoDate());
  const selectedCalendarDate = useMemo(() => new Date(`${selectedDate}T12:00:00`), [selectedDate]);
  const devotional = catalogue.length ? devotionalForDate(catalogue, selectedCalendarDate) : null;

  useEffect(() => {
    Promise.all([loadCatalogue(), desktop.getState()]).then(async ([items, state]) => {
      setCatalogue(items);
      if (!state.migrationComplete) {
        state = await desktop.migrateLegacy({
          theme: localStorage.getItem("wdwg-theme"),
          fontScale: Number(localStorage.getItem("wdwg-font-scale")) || undefined,
          translation: localStorage.getItem("wdwg-translation"),
          favourites: JSON.parse(localStorage.getItem("wdwg-favourites") || "[]"),
        });
      }
      setAppState(state);
    });
    const removeNavigate = desktop.onNavigate((view) => {
      setReaderView(view === "settings" ? "settings" : "today");
      if (view !== "settings") setSelectedDate(isoDate());
      setMode("reader"); desktop.setMode("reader");
    });
    const removeDate = desktop.onOpenDate((id) => {
      const year = new Date().getFullYear();
      setSelectedDate(`${year}-${id}`); setReaderView("today"); setMode("reader"); desktop.setMode("reader");
    });
    const removeState = desktop.onStateChanged(setAppState);
    const rollover = setInterval(() => {
      if (mode === "card" && (appState?.settings.automaticDailyContent ?? true)) setSelectedDate(isoDate());
    }, 60_000);
    return () => { removeNavigate(); removeDate(); removeState(); clearInterval(rollover); };
  }, [mode, appState?.settings.automaticDailyContent]);

  if (!devotional || !appState) return <main className="loading-screen">Preparing today’s quiet moment…</main>;
  const openReader = (view = "today") => { setReaderView(view); setMode("reader"); desktop.setMode("reader"); };
  const closeReader = () => { setSelectedDate(isoDate()); setMode("card"); desktop.setMode("card"); };
  const patchSettings = async (patch) => setAppState(await desktop.updateSettings(patch));
  const patchState = async (patch, replace = false) => setAppState(replace ? patch : await desktop.updateState(patch));
  const onSnooze = async (until) => { await desktop.snooze(until); setAppState(await desktop.getState()); };
  const favourite = appState.favourites.includes(devotional.id);
  return mode === "card"
    ? <Card devotional={devotional} favourite={favourite} streak={calculateStreak(appState.completions)} settings={appState.settings}
      onRead={openReader} onSnooze={() => onSnooze(Date.now() + appState.settings.remindLaterMinutes * 60 * 1000)}
      onFavourite={() => patchState({ favourites: favourite ? appState.favourites.filter((id) => id !== devotional.id) : [...appState.favourites, devotional.id] })} />
    : <Reader catalogue={catalogue} devotional={devotional} selectedDate={selectedDate} settings={appState.settings} appState={appState}
      initialView={readerView} onBack={closeReader} onSelectDate={(date) => setSelectedDate(isoDate(date))}
      onPatchSettings={patchSettings} onPatchState={patchState} onSnooze={onSnooze} />;
}
