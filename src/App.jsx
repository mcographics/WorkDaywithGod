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
const browserState = { settings: defaultSettings, favourites: [], completions: {}, readingPositions: {}, snoozeUntil: 0, remindAt: 0, migrationComplete: true };
const desktop = window.desktop || {
  minimize() {}, close() {}, setMode() {},
  getState: async () => browserState,
  updateSettings: async (patch) => ({ ...browserState, settings: { ...defaultSettings, ...patch } }),
  updateState: async (patch) => ({ ...browserState, ...patch }),
  migrateLegacy: async () => browserState,
  snooze: async () => ({}),
  remindLater: async () => browserState,
  testNotification: async () => ({ supported: false }), openDataFolder: async () => "",
  exportData: async () => ({ canceled: true }), importData: async () => ({ canceled: true }),
  resetHistory: async () => browserState, resetFavourites: async () => browserState, resetAll: async () => browserState,
  getAppInfo: async () => ({ version: "1.0.0", notificationSupported: false }),
  onNavigate: () => () => {}, onOpenDate: () => () => {}, onStateChanged: () => () => {},
};

function WindowControls() {
  return <div className="window-controls">
    <button title="Minimize the window to the taskbar" aria-label="Minimize" onClick={desktop.minimize}><Minus size={16} /></button>
    <button title="Hide the app in the system tray while reminders continue" aria-label="Close to tray" onClick={desktop.close}><X size={16} /></button>
  </div>;
}

function HeaderClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  const local = `${now.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })} · ${now.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}`;
  let hebrew;
  try {
    const jerusalemTime = now.toLocaleTimeString([], { timeZone: "Asia/Jerusalem", hour: "numeric", minute: "2-digit" });
    const hebrewDate = new Intl.DateTimeFormat("en-US-u-ca-hebrew", { timeZone: "Asia/Jerusalem", month: "long", day: "numeric", year: "numeric" }).format(now);
    hebrew = `${jerusalemTime} · ${hebrewDate}`;
  } catch {
    hebrew = "Hebrew calendar unavailable";
  }
  return <div className="header-clock" aria-label={`Local time ${local}. Jerusalem Hebrew date ${hebrew}.`}>
    <span><strong>Local</strong>{local}</span>
    <span><strong>Jerusalem</strong>{hebrew}</span>
  </div>;
}

function Card({ devotional, favourite, streak, onFavourite, onRead, onSnooze, settings }) {
  const [reminderMessage, setReminderMessage] = useState("");
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const verseLengthClass = devotional.verse.length > 240 ? "verse-extra-long" : devotional.verse.length > 140 ? "verse-long" : "";
  const scheduleReminder = async () => {
    const until = await onSnooze();
    setReminderMessage(`Reminder set for ${new Date(until).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`);
    window.setTimeout(() => setReminderMessage(""), 4000);
  };
  return <main className={`compact-shell accent-${settings.theme} ${settings.focusMode ? "focus-mode" : ""} ${verseLengthClass}`}>
    {!settings.focusMode && <div className={`photo-layer ${settings.imageTransition ? "" : "no-transition"}`} style={{ backgroundImage: `url("./scenes/${settings.automaticDailyImage ? devotional.image : "01-01.webp"}")` }} />}
    <div className="card-shade" style={{ "--overlay": settings.imageOverlay / 100 }} />
    <div className="drag-bar"><div className="brand-mark"><span>WORK DAY</span><em>with God</em></div><HeaderClock /><WindowControls /></div>
    <section className="verse-card">
      <div className="eyebrow"><span className="eyebrow-line" />{greeting}</div>
      <blockquote>“{devotional.verse}”</blockquote>
      <p className="reference">{devotional.reference} <span>KJV</span></p>
      <button title="Open today’s complete devotional, reflection question, and prayer" className="read-button" onClick={() => onRead("today")}>Read today’s reflection <ChevronRight size={18} /></button>
    </section>
    <footer className="compact-footer">
      <div><span className="status-dot" /> {settings.showStreak && streak ? `${streak}-day reading streak` : "A quiet reminder for your day"}</div>
      <div className="footer-actions">
        <button title={favourite ? "Remove today from favourites" : "Save today to favourites"} className={favourite ? "active" : ""} onClick={onFavourite} aria-label="Favourite"><Heart size={17} fill={favourite ? "currentColor" : "none"} /></button>
        <button disabled={!settings.notificationsEnabled} title={settings.notificationsEnabled ? `Remind me again in ${settings.remindLaterMinutes} minutes` : "Enable notifications in Settings to use Remind me later"} aria-label={settings.notificationsEnabled ? `Remind me in ${settings.remindLaterMinutes} minutes` : "Remind me later unavailable because notifications are off"} onClick={scheduleReminder}><Clock3 size={17} /></button>
        <button title="Open application settings" aria-label="Settings" onClick={() => onRead("settings")}><SlidersHorizontal size={17} /></button>
      </div>
    </footer>
    {reminderMessage && <div className="card-toast" role="status">{reminderMessage}</div>}
  </main>;
}

function ScriptureDrawer({ reference, translation, scriptureFontScale, onTranslation, onFontScale, onClose }) {
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
        <div className="scripture-actions">
          <button title="Make the full-chapter Scripture text smaller" aria-label="Decrease Scripture text size" onClick={() => onFontScale(Math.max(.8, scriptureFontScale - .1))}>A−</button>
          <button title="Make the full-chapter Scripture text larger" aria-label="Increase Scripture text size" onClick={() => onFontScale(Math.min(1.4, scriptureFontScale + .1))}>A+</button>
          <button title="Close the full-chapter reader" aria-label="Close Scripture" onClick={onClose}><X size={19} /></button>
        </div>
      </div>
      <label className="translation-select"><span>Translation</span>
        <select title="Choose the locally stored translation used for full-chapter reading" value={translation} onChange={(event) => onTranslation(event.target.value)}>
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

function ReadingView({ devotional, selectedDate, dateScope, settings, appState, onBack, onSettings, onPatchSettings, onPatchState, onToggleFavourite, onToggleComplete, onSelectDate }) {
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
    const nextKey = isoDate(next);
    const todayKey = isoDate();
    if (dateScope === "today") return;
    if (dateScope === "past" && nextKey > todayKey) return;
    if (dateScope === "future" && nextKey <= todayKey) return;
    onSelectDate(next);
  };
  const previousKey = isoDate(new Date(new Date(`${selectedDate}T12:00:00`).setDate(new Date(`${selectedDate}T12:00:00`).getDate() - 1)));
  const nextKey = isoDate(new Date(new Date(`${selectedDate}T12:00:00`).setDate(new Date(`${selectedDate}T12:00:00`).getDate() + 1)));
  const todayKey = isoDate();
  const canGoPrevious = dateScope === "past" ? true : dateScope === "future" && previousKey > todayKey;
  const canGoNext = dateScope === "future" ? true : dateScope === "past" && nextKey <= todayKey;

  return <div className="reader-layout">
    <aside className="reader-aside">
      <button title="Return to the previous card or calendar view" className="back-link" onClick={onBack}><ArrowLeft size={16} /> Verse card</button>
      <div className="today-label">{new Date(`${selectedDate}T12:00:00`).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}</div>
      <h1>{devotional.title.replace(/\s·\s\d+$/, "")}</h1>
      <div className="aside-verse">“{devotional.verse}”<strong>{devotional.reference}</strong></div>
      <button title="Open the complete Bible chapter containing today’s anchor verse" className="scripture-link" onClick={() => setScriptureOpen(true)}><BookOpen size={15} /> Read the full chapter</button>
      <div className="day-nav"><button title="Open the previous available devotional" disabled={!canGoPrevious} aria-label="Previous devotional" onClick={() => adjacent(-1)}><ArrowLeft size={16} /></button><span>Day {devotional.dayNumber} of 366</span><button title="Open the next available devotional" disabled={!canGoNext} aria-label="Next devotional" onClick={() => adjacent(1)}><ArrowRight size={16} /></button></div>
      <button title={completed ? "Remove this devotional from completed readings" : "Record this devotional as completed"} className={`complete-button ${completed ? "done" : ""}`} onClick={onToggleComplete}>{completed ? <><Check size={17} /> Reading completed</> : "Mark as complete"}</button>
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
      <button className={favourite ? "active" : ""} onClick={onToggleFavourite} title={favourite ? "Remove this devotional from favourites" : "Save this devotional to favourites"}><Heart size={18} fill={favourite ? "currentColor" : "none"} /><span>{favourite ? "Favourited" : "Favourite"}</span></button>
      <div className="divider" />
      <button title="Make the devotional reflection text smaller" onClick={() => onPatchSettings({ fontScale: Math.max(.8, settings.fontScale - .1) })}><strong>A−</strong><span>Decrease text</span></button>
      <button title="Make the devotional reflection text larger" onClick={() => onPatchSettings({ fontScale: Math.min(1.4, settings.fontScale + .1) })}><strong>A+</strong><span>Increase text</span></button>
      <div className="divider" />
      <button disabled={!settings.autoScrollEnabled || settings.reducedMotion} onClick={() => setScrolling(!scrolling)} title={scrolling ? "Pause automatic page scrolling" : "Start scrolling the devotional automatically"}>{scrolling ? <Pause size={18} /> : <Play size={18} />}<span>{scrolling ? "Pause scroll" : "Auto-scroll"}</span></button>
      <button onClick={() => { setScrolling(false); scrollRef.current.scrollTop = 0; }} title="Stop auto-scroll and return to the beginning"><RotateCcw size={17} /><span>Restart Auto-Scroll</span></button>
      <button onClick={onSettings} title="Open reading and appearance settings"><Settings size={17} /><span>Reading settings</span></button>
    </div>
    {scriptureOpen && <ScriptureDrawer reference={devotional.reference} translation={settings.translation} scriptureFontScale={settings.scriptureFontScale} onTranslation={(translation) => onPatchSettings({ translation })} onFontScale={(scriptureFontScale) => onPatchSettings({ scriptureFontScale })} onClose={() => setScriptureOpen(false)} />}
  </div>;
}

function CalendarView({ catalogue, appState, mode, onSelectDate }) {
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const firstOffset = month.getDay();
  const lastDayOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells = [...Array(firstOffset).fill(null), ...Array.from({ length: lastDayOfMonth }, (_, index) => index + 1)];
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const currentMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const isHistory = mode === "history";
  const canGoPreviousMonth = isHistory || month > currentMonth;
  const canGoNextMonth = !isHistory || month < currentMonth;
  return <section className="panel-view calendar-view">
    <div className="panel-heading calendar-heading"><div><span>{isHistory ? "Your journey" : "What lies ahead"}</span><h1>{isHistory ? "Reading history" : "Future devotionals"}</h1><p>{isHistory ? `${calculateStreak(appState.completions)}-day current streak · ${Object.keys(appState.completions).length} readings completed` : "Choose an upcoming date to read its devotional."}</p></div>
      <div className="month-nav"><button title="Show the previous available month" disabled={!canGoPreviousMonth} aria-label="Previous month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}><ChevronLeft /></button><strong>{month.toLocaleDateString(undefined, { month: "long", year: "numeric" })}</strong><button title="Show the next available month" disabled={!canGoNextMonth} aria-label="Next month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}><ChevronRight /></button></div>
    </div>
    <div className="calendar-grid">{["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((day) => <div className="weekday" key={day}>{day}</div>)}
      {cells.map((day, index) => {
        if (!day) return <div key={`empty-${index}`} />;
        const date = new Date(month.getFullYear(), month.getMonth(), day, 12);
        const item = devotionalForDate(catalogue, date);
        const key = isoDate(date);
        const available = isHistory ? date.getTime() <= today.getTime() : date.getTime() > today.getTime();
        if (!available) return <div className="unavailable-day" key={key}><span>{day}</span></div>;
        return <button title={`Open the ${date.toLocaleDateString()} devotional`} aria-label={`Open devotional for ${date.toLocaleDateString()}`} key={key} className={`${appState.completions[key] ? "completed-day" : ""}`} onClick={() => onSelectDate(date)}>
          <span>{day}</span><small>{item.theme}</small>{appState.favourites.includes(item.id) && <Heart size={12} fill="currentColor" />}{appState.completions[key] && <Check size={13} />}
        </button>;
      })}
    </div>
  </section>;
}

function Toggle({ checked, onChange, label, description }) {
  return <button title={`${description || label} Currently ${checked ? "on" : "off"}.`} className={`toggle ${checked ? "on" : ""}`} role="switch" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)}><span /></button>;
}

function SettingsView({ settings, appState, onBack, onPatchSettings, onSnooze, onPatchState }) {
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
  const readingOptions = [
    ["focusMode", "Image-free focus mode", "Hide scenic backgrounds for a distraction-free reading view."],
    ["reducedMotion", "Reduced motion", "Disable transitions and animated scrolling for greater visual comfort."],
    ["autoScrollEnabled", "Auto-scroll", "Allow the reader to scroll devotional text automatically."],
    ["hoverPausesScroll", "Pause auto-scroll while hovering", "Temporarily pause automatic scrolling while the pointer is over the text."],
    ["rememberReadingPosition", "Remember reading position", "Return to the last scroll position when reopening a devotional."],
    ["showReflectionPrompt", "Show reflection question", "Display the practical pause-and-reflect question in each devotional."],
    ["showPrayer", "Show closing prayer", "Display the short prayer at the end of each devotional."],
    ["showAttribution", "Show attribution", "Display the Work Day with God content attribution beneath each reading."],
  ];
  const dailyOptions = [
    ["automaticDailyContent", "Change devotional each day", "Automatically select the devotional assigned to the local calendar date."],
    ["automaticDailyImage", "Change scenic image each day", "Use the scenic background assigned to each daily devotional."],
    ["imageTransition", "Scenic image transition", "Fade smoothly when the daily scenic background changes."],
    ["preventFutureDevotionals", "Hide future devotionals", "Remove the Future Devotionals tab and prevent upcoming readings from being opened."],
    ["showStreak", "Show reading streak", "Display the number of consecutive days marked as completed."],
  ];
  return <section className="panel-view settings-view">
    <div className="panel-heading settings-heading">
      <div><span>Make it yours</span><h1>Settings</h1><p>Everything is stored locally on this computer.</p></div>
      <button title="Close Settings and return to the compact daily Verse Card" className="settings-back-button" onClick={onBack}><ArrowLeft size={16} /><span><strong>Back to Verse Card</strong><small>Return to today’s compact Scripture card.</small></span></button>
    </div>
    <div className="settings-sections">
      <div className="settings-group"><h2>Startup & tray</h2>
        <div className="setting-row"><div><h3>Launch at login</h3><p>Open today’s card when you sign in to Windows.</p></div><Toggle label="Launch at login" checked={settings.launchAtLogin} onChange={(launchAtLogin) => onPatchSettings({ launchAtLogin })} /></div>
        <div className="setting-row"><div><h3>Show card at startup</h3><p>Display today’s verse after Windows login.</p></div><Toggle label="Show card at startup" checked={settings.showStartupCard} onChange={(showStartupCard) => onPatchSettings({ showStartupCard })} /></div>
        <div className="setting-row"><div><h3>Start silently in tray</h3><p>Keep the startup card hidden while reminders remain active.</p></div><Toggle label="Start in tray" checked={settings.startInTray} onChange={(startInTray) => onPatchSettings({ startInTray })} /></div>
      </div>
      <div className="settings-group"><h2>Gentle reminders</h2>
        <div className="setting-row"><div><h3>Notifications</h3><p>Master switch for all scheduled reminders.</p></div><Toggle label="Notifications" checked={settings.notificationsEnabled} onChange={(notificationsEnabled) => onPatchSettings({ notificationsEnabled })} /></div>
        <div className="setting-row"><div><h3>Notification sound</h3><p>Allow Windows to play its notification sound.</p></div><Toggle label="Notification sound" checked={settings.notificationSound} onChange={(notificationSound) => onPatchSettings({ notificationSound })} /></div>
        <div className="setting-row stack"><div><h3>Schedule style</h3><p>Choose fixed reminder times or a repeating minute interval.</p></div><div className="segmented"><button title="Send reminders at the individual times listed below" className={settings.reminderMode === "times" ? "selected" : ""} onClick={() => onPatchSettings({ reminderMode: "times" })}>Specific times</button><button title="Repeat reminders after a chosen number of minutes" className={settings.reminderMode === "interval" ? "selected" : ""} onClick={() => onPatchSettings({ reminderMode: "interval" })}>Interval</button></div></div>
        {settings.reminderMode === "times" ? <div className="time-list" title="Times when notifications may be sent on active weekdays">{settings.reminderTimes.map((time, index) => <label title={`Reminder scheduled for ${time}`} key={`${time}-${index}`}><input aria-label={`Reminder time ${index + 1}`} type="time" value={time} onChange={(event) => updateTime(index, event.target.value)} /><button title={`Remove the ${time} reminder`} aria-label={`Remove ${time}`} onClick={() => onPatchSettings({ reminderTimes: settings.reminderTimes.filter((_, itemIndex) => itemIndex !== index) })}><X size={12} /></button></label>)}<button title="Add another specific reminder time" onClick={() => onPatchSettings({ reminderTimes: [...settings.reminderTimes, "10:00"].sort() })}>+ Add time</button></div>
          : <label title="Set how many minutes pass between reminders" className="field-label"><span><strong>Reminder interval</strong><small>Minutes between notifications during active hours.</small></span><span className="number-field"><input aria-label="Reminder interval in minutes" type="number" min="15" max="720" step="5" value={settings.intervalMinutes} onChange={(event) => onPatchSettings({ intervalMinutes: Number(event.target.value) })} /> minutes</span></label>}
        <div className="weekday-picker" title="Choose which weekdays may send devotional reminders">{["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((label, day) => <button title={`${settings.activeDays.includes(day) ? "Disable" : "Enable"} reminders on ${label}`} key={label} className={settings.activeDays.includes(day) ? "selected" : ""} onClick={() => toggleDay(day)}>{label}</button>)}</div>
        <div className="setting-row"><div><h3>Quiet hours</h3><p>No notifications during this period.</p></div><Toggle label="Quiet hours" checked={settings.quietHours.enabled} onChange={(enabled) => updateQuiet({ enabled })} /></div>
        {settings.quietHours.enabled && <div className="quiet-times" title="Notifications remain silent between these local times"><input aria-label="Quiet hours start time" type="time" value={settings.quietHours.start} onChange={(event) => updateQuiet({ start: event.target.value })} /><span>to</span><input aria-label="Quiet hours end time" type="time" value={settings.quietHours.end} onChange={(event) => updateQuiet({ end: event.target.value })} /></div>}
        <div className="snooze-row"><Bell size={18} /><span>{paused ? `Paused until ${new Date(appState.snoozeUntil).toLocaleString()}` : "Reminders are active"}</span>{paused ? <button title="End the current pause and resume scheduled reminders" onClick={() => onSnooze(0)}>Resume</button> : <><button title="Temporarily stop reminders for the next hour" onClick={() => onSnooze(Date.now() + 60 * 60 * 1000)}>Pause 1 hour</button><button title="Stop reminders until midnight tonight" onClick={() => { const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1); tomorrow.setHours(0,0,0,0); onSnooze(tomorrow.getTime()); }}>Until tomorrow</button></>}</div>
        <label title="Set the snooze duration used by the Verse Card clock button" className="field-label"><span><strong>“Remind me later” duration</strong><small>How long the Verse Card clock button pauses reminders.</small></span><span className="number-field"><input aria-label="Remind me later duration in minutes" type="number" min="5" max="1440" value={settings.remindLaterMinutes} onChange={(event) => onPatchSettings({ remindLaterMinutes: Number(event.target.value) })} /> minutes</span></label>
        <div className="action-row"><button disabled={!settings.notificationsEnabled} title={settings.notificationsEnabled ? "Display a sample Windows notification using the current notification settings" : "Enable notifications before sending a test notification"} onClick={() => run(async () => { const result = await desktop.testNotification(); if (!result.supported) throw new Error("Windows notifications are unavailable on this system."); return result; }, "Test notification sent.")}>Send test notification</button></div>
      </div>
      <div className="settings-group"><h2>Appearance & reading</h2>
        <div className="theme-options expanded">{["gold","blue","forest","burgundy","lavender","terracotta","sage","rose","teal","charcoal"].map((theme) => <button title={`Use the ${theme} accent colour throughout the app`} key={theme} className={settings.theme === theme ? "chosen" : ""} onClick={() => onPatchSettings({ theme })}><i className={theme} />{theme}</button>)}</div>
        <label title="Choose whether the reader follows Windows or uses a fixed light or dark appearance" className="field-label"><span><strong>Colour mode</strong><small>Controls the overall light or dark reading appearance.</small></span><select aria-label="Colour mode" value={settings.colorMode} onChange={(event) => onPatchSettings({ colorMode: event.target.value })}><option value="system">Follow Windows</option><option value="light">Light</option><option value="dark">Dark</option></select></label>
        <label title="Choose the translation used when reading a complete Bible chapter" className="field-label"><span><strong>Bible translation</strong><small>Used in the full-chapter drawer; daily anchor quotations remain KJV.</small></span><select aria-label="Bible translation" value={settings.translation} onChange={(event) => onPatchSettings({ translation: event.target.value })}>{translations.map((item) => <option value={item.id} key={item.id}>{item.label}</option>)}</select></label>
        <label title="Adjust the size of devotional reflection paragraphs and questions" className="range-field"><span><strong>Devotional text size</strong><small>Changes the main reflection text, not the Verse Card or Scripture drawer.</small></span><input aria-label="Devotional text size" type="range" min=".8" max="1.4" step=".05" value={settings.fontScale} onChange={(event) => onPatchSettings({ fontScale: Number(event.target.value) })} /></label>
        <label title="Adjust the text size inside the full-chapter Scripture drawer" className="range-field"><span><strong>Scripture text size</strong><small>Changes Bible verses in the full-chapter reader.</small></span><input aria-label="Scripture text size" type="range" min=".8" max="1.4" step=".05" value={settings.scriptureFontScale} onChange={(event) => onPatchSettings({ scriptureFontScale: Number(event.target.value) })} /></label>
        <label title="Choose how quickly automatic reading moves down the page" className="range-field"><span><strong>Auto-scroll speed</strong><small>Sets the movement speed used by the Auto-scroll button.</small></span><input aria-label="Auto-scroll speed" type="range" min="1" max="4" step="1" value={settings.autoScrollSpeed} onChange={(event) => onPatchSettings({ autoScrollSpeed: Number(event.target.value) })} /></label>
        {readingOptions.map(([key, label, description]) => <div className="setting-row compact" key={key}><div><h3>{label}</h3><p>{description}</p></div><Toggle label={label} description={description} checked={settings[key]} onChange={(value) => onPatchSettings({ [key]: value })} /></div>)}
      </div>
      <div className="settings-group"><h2>Daily content & scenic images</h2>
        {dailyOptions.map(([key,label,description]) => <div className="setting-row compact" key={key}><div><h3>{label}</h3><p>{description}</p></div><Toggle label={label} description={description} checked={settings[key]} onChange={(value) => onPatchSettings({ [key]: value })} /></div>)}
        <label title="Adjust the dark overlay that keeps Verse Card text readable over scenic images" className="range-field"><span><strong>Image darkness</strong><small>Darkens the scenic background behind the Verse Card text.</small></span><input aria-label="Image darkness" type="range" min="10" max="75" value={settings.imageOverlay} onChange={(event) => onPatchSettings({ imageOverlay: Number(event.target.value) })} /></label>
      </div>
      <div className="settings-group"><h2>History & personal data</h2>
        <div className="action-row"><button title="Delete completion dates, streak information, and saved reading positions" onClick={() => run(async () => ({ state: await desktop.resetHistory() }), "Reading history cleared.")}>Clear reading history</button><button title="Remove every devotional saved as a favourite" onClick={() => run(async () => ({ state: await desktop.resetFavourites() }), "Favourites cleared.")}>Clear favourites</button></div>
        <div className="action-row"><button title="Open the Windows folder containing this app’s local settings and reading data" onClick={() => run(() => desktop.openDataFolder(), "Local data folder opened.")}>Open data folder</button><button title="Save settings, favourites, and reading history to a portable JSON backup" onClick={() => run(() => desktop.exportData(), "Backup exported.")}>Export backup</button><button title="Restore settings and reading data from a previously exported JSON backup" onClick={() => run(() => desktop.importData(), "Backup imported.")}>Import backup</button></div>
        <div className="action-row danger"><button title="Restore every setting to default and erase all local reading history and favourites" onClick={() => window.confirm("Reset all Work Day with God settings and history?") && run(async () => ({ state: await desktop.resetAll() }), "Application reset.")}>Reset entire application</button></div>
      </div>
      <div className="settings-group"><h2>About</h2><div className="about-row"><span>Work Day with God {appInfo?.version}</span><span>Notifications: {appInfo?.notificationSupported ? "supported" : "unavailable"}</span></div></div>
      {message && <div className="settings-message" role="status">{message}</div>}
    </div>
  </section>;
}

function Reader({ catalogue, devotional, selectedDate, settings, appState, initialView, onBack, onSelectDate, onPatchSettings, onPatchState, onSnooze }) {
  const [view, setView] = useState(initialView || "today");
  useEffect(() => setView(initialView || "today"), [initialView]);
  useEffect(() => {
    if (settings.preventFutureDevotionals && (view === "future" || view === "future-reading")) {
      onSelectDate(new Date());
      setView("today");
    }
  }, [settings.preventFutureDevotionals, view]);
  useEffect(() => {
    if (view !== "today") return;
    onSelectDate(new Date());
    const timer = setInterval(() => onSelectDate(new Date()), 60_000);
    return () => clearInterval(timer);
  }, [view]);
  const favourite = appState.favourites.includes(devotional.id);
  const showToday = () => {
    onSelectDate(new Date());
    setView("today");
  };
  const toggleFavourite = () => onPatchState({ favourites: favourite ? appState.favourites.filter((id) => id !== devotional.id) : [...appState.favourites, devotional.id] });
  const toggleComplete = () => {
    const completions = { ...appState.completions };
    if (completions[selectedDate]) delete completions[selectedDate];
    else completions[selectedDate] = Date.now();
    onPatchState({ completions });
  };
  return <main className={`reader-shell theme-${settings.theme} accent-${settings.theme} mode-${settings.colorMode} ${settings.reducedMotion ? "reduced-motion" : ""}`}>
    <header className="reader-header">
      <button title="Return to the compact Verse Card" className="wordmark" onClick={onBack}><span>WORK DAY</span><em>with God</em></button>
      <nav>
        <button title="Open the devotional assigned to today’s local date" className={view === "today" ? "selected" : ""} onClick={showToday}><BookOpen size={16} /> Today</button>
        {!settings.preventFutureDevotionals && <button title="Browse devotionals assigned to dates after today" className={view === "future" || view === "future-reading" ? "selected" : ""} onClick={() => setView("future")}><CalendarDays size={16} /> Future Devotionals</button>}
        <button title="Browse devotional dates before today and review reading activity" className={view === "history" || view === "history-reading" ? "selected" : ""} onClick={() => setView("history")}><History size={16} /> History</button>
        <button title="Configure reminders, appearance, reading behavior, and local data" className={view === "settings" ? "selected" : ""} onClick={() => setView("settings")}><Settings size={16} /> Settings</button>
      </nav><WindowControls />
    </header>
    {view === "today" && <ReadingView devotional={devotional} selectedDate={selectedDate} dateScope="today" settings={settings} appState={appState} onBack={onBack} onSettings={() => setView("settings")} onPatchSettings={onPatchSettings} onPatchState={onPatchState} onToggleFavourite={toggleFavourite} onToggleComplete={toggleComplete} onSelectDate={onSelectDate} />}
    {view === "history" && <CalendarView catalogue={catalogue} appState={appState} mode="history" onSelectDate={(date) => { onSelectDate(date); setView("history-reading"); }} />}
    {view === "history-reading" && <ReadingView devotional={devotional} selectedDate={selectedDate} dateScope="past" settings={settings} appState={appState} onBack={() => setView("history")} onSettings={() => setView("settings")} onPatchSettings={onPatchSettings} onPatchState={onPatchState} onToggleFavourite={toggleFavourite} onToggleComplete={toggleComplete} onSelectDate={onSelectDate} />}
    {view === "future" && !settings.preventFutureDevotionals && <CalendarView catalogue={catalogue} appState={appState} mode="future" onSelectDate={(date) => { onSelectDate(date); setView("future-reading"); }} />}
    {view === "future-reading" && !settings.preventFutureDevotionals && <ReadingView devotional={devotional} selectedDate={selectedDate} dateScope="future" settings={settings} appState={appState} onBack={() => setView("future")} onSettings={() => setView("settings")} onPatchSettings={onPatchSettings} onPatchState={onPatchState} onToggleFavourite={toggleFavourite} onToggleComplete={toggleComplete} onSelectDate={onSelectDate} />}
    {view === "settings" && <SettingsView settings={settings} appState={appState} onBack={onBack} onPatchSettings={onPatchSettings} onSnooze={onSnooze} onPatchState={onPatchState} />}
  </main>;
}

export default function App() {
  const [catalogue, setCatalogue] = useState([]);
  const [appState, setAppState] = useState(null);
  const [mode, setMode] = useState("card");
  const [readerView, setReaderView] = useState("today");
  const [selectedDate, setSelectedDate] = useState(() => isoDate());
  const [startupError, setStartupError] = useState("");
  const selectedCalendarDate = useMemo(() => new Date(`${selectedDate}T12:00:00`), [selectedDate]);
  const devotional = catalogue.length ? devotionalForDate(catalogue, selectedCalendarDate) : null;

  useEffect(() => {
    let active = true;
    Promise.all([loadCatalogue(), desktop.getState()]).then(async ([items, state]) => {
      setCatalogue(items);
      if (!state.migrationComplete) {
        let legacyFavourites = [];
        try { legacyFavourites = JSON.parse(localStorage.getItem("wdwg-favourites") || "[]"); } catch {}
        state = await desktop.migrateLegacy({
          theme: localStorage.getItem("wdwg-theme"),
          fontScale: Number(localStorage.getItem("wdwg-font-scale")) || undefined,
          translation: localStorage.getItem("wdwg-translation"),
          favourites: legacyFavourites,
        });
      }
      if (active) setAppState(state);
    }).catch((error) => active && setStartupError(error.message || "The application could not be opened."));
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
    return () => { active = false; removeNavigate(); removeDate(); removeState(); };
  }, []);

  useEffect(() => {
    const rollover = setInterval(() => {
      if (mode === "card" && (appState?.settings.automaticDailyContent ?? true)) setSelectedDate(isoDate());
    }, 60_000);
    return () => clearInterval(rollover);
  }, [mode, appState?.settings.automaticDailyContent]);

  if (startupError) return <main className="loading-screen">{startupError}</main>;
  if (!devotional || !appState) return <main className="loading-screen">Preparing today’s quiet moment…</main>;
  const openReader = (view = "today") => { setReaderView(view); setMode("reader"); desktop.setMode("reader"); };
  const closeReader = () => { setSelectedDate(isoDate()); setMode("card"); desktop.setMode("card"); };
  const patchSettings = async (patch) => setAppState(await desktop.updateSettings(patch));
  const patchState = async (patch, replace = false) => setAppState(replace ? patch : await desktop.updateState(patch));
  const onSnooze = async (until) => { await desktop.snooze(until); setAppState(await desktop.getState()); };
  const onRemindLater = async () => {
    const until = Date.now() + appState.settings.remindLaterMinutes * 60 * 1000;
    setAppState(await desktop.remindLater(until));
    return until;
  };
  const favourite = appState.favourites.includes(devotional.id);
  return mode === "card"
    ? <Card devotional={devotional} favourite={favourite} streak={calculateStreak(appState.completions)} settings={appState.settings}
      onRead={openReader} onSnooze={onRemindLater}
      onFavourite={() => patchState({ favourites: favourite ? appState.favourites.filter((id) => id !== devotional.id) : [...appState.favourites, devotional.id] })} />
    : <Reader catalogue={catalogue} devotional={devotional} selectedDate={selectedDate} settings={appState.settings} appState={appState}
      initialView={readerView} onBack={closeReader} onSelectDate={(date) => setSelectedDate(isoDate(date))}
      onPatchSettings={patchSettings} onPatchState={patchState} onSnooze={onSnooze} />;
}
