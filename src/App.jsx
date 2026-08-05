import { useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import {
  ArrowLeft, ArrowRight, Bell, BookOpen, CalendarDays, Check, ChevronLeft, ChevronRight,
  Clock3, ExternalLink, Heart, History, Info, Maximize2, Menu, MessageCircle, Minimize2, Minus, Pause, Play, RefreshCw, RotateCcw, Settings, SlidersHorizontal, UserRound, X,
} from "lucide-react";
import { calendarStartMonth, isAdjacentReadingAvailable, isCalendarDateAvailable } from "./calendar.mjs";
import { calculateStreak, dateId, devotionalForDate, isoDate, loadCatalogue } from "./catalogue";
import { getChapter, translations } from "./scripture";
import { isSunUp } from "./solar.mjs";
import { defaultSettings, isMobilePlatform, platform, platformName } from "./platform";

function useResolvedColourMode(colourMode) {
  const [position, setPosition] = useState(null);
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    if (colourMode !== "auto") return undefined;
    setNow(new Date());
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    let active = true;
    desktop.getPosition().then((position) => active && setPosition(position)).catch(() => {});
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [colourMode]);
  return colourMode === "auto" ? (isSunUp(now, position) ? "light" : "dark") : colourMode;
}

const intervalMinuteOptions = Array.from({ length: 120 }, (_, index) => index + 1);
const remindLaterOptions = Array.from({ length: 9 }, (_, index) => (index + 1) * 10);
const desktop = platform;

function WindowControls() {
  if (isMobilePlatform) return null;
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
  const hasActiveDays = settings.activeDays.length > 0;
  const reminderAvailable = settings.notificationsEnabled && hasActiveDays;
  const reminderTitle = !hasActiveDays
    ? "Please select a day in Schedule style in Settings to start the timer."
    : settings.notificationsEnabled
      ? `Remind me again in ${settings.remindLaterMinutes} minutes`
      : "Enable notifications in Settings to use Remind me later";
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
        <span className="timer-action" title={reminderTitle}><button disabled={!reminderAvailable} aria-label={reminderAvailable ? `Remind me in ${settings.remindLaterMinutes} minutes` : reminderTitle} onClick={scheduleReminder}><Clock3 size={17} /></button></span>
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

function ReadingView({ devotional, selectedDate, dateScope, settings, appState, readingMode, onReadingModeChange, onBack, onSettings, onPatchSettings, onPatchState, onToggleFavourite, onToggleComplete, onSelectDate }) {
  const [scrolling, setScrolling] = useState(false);
  const [hoverPaused, setHoverPaused] = useState(false);
  const [scriptureOpen, setScriptureOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const scrollRef = useRef(null);
  const favourite = appState.favourites.includes(devotional.id);
  const completed = Boolean(appState.completions[selectedDate]);
  const isAndroidReader = isMobilePlatform && platformName === "android";

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
  useEffect(() => setMenuOpen(false), [selectedDate, readingMode]);

  const adjacent = (direction) => {
    const next = new Date(`${selectedDate}T12:00:00`);
    next.setDate(next.getDate() + direction);
    if (!isAdjacentReadingAvailable(dateScope, next)) return;
    onSelectDate(next);
  };
  const selectedCalendarDate = new Date(`${selectedDate}T12:00:00`);
  const previousDate = new Date(selectedCalendarDate);
  const nextDate = new Date(selectedCalendarDate);
  previousDate.setDate(previousDate.getDate() - 1);
  nextDate.setDate(nextDate.getDate() + 1);
  const canGoPrevious = isAdjacentReadingAvailable(dateScope, previousDate);
  const canGoNext = isAdjacentReadingAvailable(dateScope, nextDate);

  const runMenuAction = (action) => {
    setMenuOpen(false);
    action();
  };

  return <div className="reader-layout">
    <aside className="reader-aside">
      <button title="Return to the compact Verse Card" className="back-link" onClick={onBack}><ArrowLeft size={16} /> Verse card</button>
      <div className="today-label">{new Date(`${selectedDate}T12:00:00`).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}</div>
      <h1>{devotional.title.replace(/\s·\s\d+$/, "")}</h1>
      <div className="aside-verse">“{devotional.verse}”<strong>{devotional.reference}</strong></div>
      <button title="Open the complete Bible chapter containing today’s anchor verse" className="scripture-link" onClick={() => setScriptureOpen(true)}><BookOpen size={15} /> Read the full chapter</button>
      <div className="day-nav"><button title="Open the previous available devotional" disabled={!canGoPrevious} aria-label="Previous devotional" onClick={() => adjacent(-1)}><ArrowLeft size={16} /></button><span>Day {devotional.dayNumber} of 366</span><button title="Open the next available devotional" disabled={!canGoNext} aria-label="Next devotional" onClick={() => adjacent(1)}><ArrowRight size={16} /></button></div>
      <button title={completed ? "Remove this devotional from completed readings" : "Record this devotional as completed"} className={`complete-button ${completed ? "done" : ""}`} onClick={onToggleComplete}>{completed ? <><Check size={17} /> Reading completed</> : "Mark as complete"}</button>
      {isAndroidReader && <button type="button" className="reader-menu-button" aria-haspopup="dialog" aria-expanded={menuOpen} onClick={() => setMenuOpen(true)}><Menu size={19} /><span>Menu</span></button>}
    </aside>
    <article className="reflection" ref={scrollRef} style={{ "--font-scale": settings.fontScale }}
      onMouseEnter={() => settings.hoverPausesScroll && setHoverPaused(true)}
      onMouseLeave={() => setHoverPaused(false)}>
      {isAndroidReader && readingMode && <button type="button" className="reading-mode-exit" aria-label="Exit devotional reading mode" title="Exit devotional reading mode" onClick={() => onReadingModeChange(false)}><Minimize2 size={18} /></button>}
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
    {isAndroidReader && menuOpen && <div className="reader-menu-backdrop" role="presentation" onClick={() => setMenuOpen(false)}>
      <section className="reader-menu" role="dialog" aria-modal="true" aria-labelledby="reader-menu-title" onClick={(event) => event.stopPropagation()}>
        <header><div><span>Devotional controls</span><h2 id="reader-menu-title">Reading menu</h2></div><button type="button" aria-label="Close reading menu" title="Close reading menu" onClick={() => setMenuOpen(false)}><X size={20} /></button></header>
        <button type="button" className="reading-mode-action" onClick={() => runMenuAction(() => onReadingModeChange(true))}><Maximize2 size={19} /><span><strong>Devotional reading mode</strong><small>Show only the devotional and use the full screen.</small></span></button>
        <div className="reader-menu-actions">
          <button type="button" onClick={() => runMenuAction(onBack)}><ArrowLeft size={18} /><span>Verse Card</span></button>
          <button type="button" className={completed ? "active" : ""} onClick={() => runMenuAction(onToggleComplete)}><Check size={18} /><span>{completed ? "Reading completed" : "Mark complete"}</span></button>
          <button type="button" onClick={() => runMenuAction(() => setScriptureOpen(true))}><BookOpen size={18} /><span>Full chapter</span></button>
          <button type="button" className={favourite ? "active" : ""} onClick={() => runMenuAction(onToggleFavourite)}><Heart size={18} fill={favourite ? "currentColor" : "none"} /><span>{favourite ? "Favourited" : "Favourite"}</span></button>
          <button type="button" disabled={!canGoPrevious} onClick={() => runMenuAction(() => adjacent(-1))}><ArrowLeft size={18} /><span>Previous devotional</span></button>
          <button type="button" disabled={!canGoNext} onClick={() => runMenuAction(() => adjacent(1))}><ArrowRight size={18} /><span>Next devotional</span></button>
          <button type="button" onClick={() => runMenuAction(() => onPatchSettings({ fontScale: Math.max(.8, settings.fontScale - .1) }))}><strong>A−</strong><span>Decrease text</span></button>
          <button type="button" onClick={() => runMenuAction(() => onPatchSettings({ fontScale: Math.min(1.4, settings.fontScale + .1) }))}><strong>A+</strong><span>Increase text</span></button>
          <button type="button" disabled={!settings.autoScrollEnabled || settings.reducedMotion} onClick={() => runMenuAction(() => setScrolling(!scrolling))}>{scrolling ? <Pause size={18} /> : <Play size={18} />}<span>{scrolling ? "Pause scroll" : "Auto-scroll"}</span></button>
          <button type="button" onClick={() => runMenuAction(() => { setScrolling(false); scrollRef.current.scrollTop = 0; })}><RotateCcw size={18} /><span>Restart reading</span></button>
          <button type="button" className="reader-menu-settings" onClick={() => runMenuAction(onSettings)}><Settings size={18} /><span>Reading settings</span></button>
        </div>
      </section>
    </div>}
    {scriptureOpen && <ScriptureDrawer reference={devotional.reference} translation={settings.translation} scriptureFontScale={settings.scriptureFontScale} onTranslation={(translation) => onPatchSettings({ translation })} onFontScale={(scriptureFontScale) => onPatchSettings({ scriptureFontScale })} onClose={() => setScriptureOpen(false)} />}
  </div>;
}

function CalendarView({ catalogue, appState, mode, onSelectDate }) {
  const [month, setMonth] = useState(() => calendarStartMonth(mode));
  const firstOffset = month.getDay();
  const lastDayOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells = [...Array(firstOffset).fill(null), ...Array.from({ length: lastDayOfMonth }, (_, index) => index + 1)];
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const boundaryMonth = calendarStartMonth(mode, today);
  const isHistory = mode === "history";
  const canGoPreviousMonth = isHistory || month > boundaryMonth;
  const canGoNextMonth = !isHistory || month < boundaryMonth;
  return <section className="panel-view calendar-view">
    <div className="panel-heading calendar-heading"><div><span>{isHistory ? "Your journey" : "What lies ahead"}</span><h1>{isHistory ? "Reading history" : "Future devotionals"}</h1><p>{isHistory ? `${calculateStreak(appState.completions)}-day current streak · ${Object.keys(appState.completions).length} readings completed` : "Choose today or an upcoming date to read its devotional."}</p></div>
      <div className="month-nav"><button title="Show the previous available month" disabled={!canGoPreviousMonth} aria-label="Previous month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}><ChevronLeft /></button><strong>{month.toLocaleDateString(undefined, { month: "long", year: "numeric" })}</strong><button title="Show the next available month" disabled={!canGoNextMonth} aria-label="Next month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}><ChevronRight /></button></div>
    </div>
    <div className="calendar-grid">{["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((day) => <div className="weekday" key={day}>{day}</div>)}
      {cells.map((day, index) => {
        if (!day) return <div key={`empty-${index}`} />;
        const date = new Date(month.getFullYear(), month.getMonth(), day, 12);
        const item = devotionalForDate(catalogue, date);
        const key = isoDate(date);
        const available = isCalendarDateAvailable(mode, date, today);
        if (!available) return <div className="unavailable-day" key={key}><span>{day}</span></div>;
        const classes = [appState.completions[key] ? "completed-day" : "", key === isoDate(today) ? "current-day" : ""].filter(Boolean).join(" ");
        return <button title={`Open the ${date.toLocaleDateString()} devotional`} aria-label={`Open devotional for ${date.toLocaleDateString()}`} key={key} className={classes} onClick={() => onSelectDate(date)}>
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
  const [updateStatus, setUpdateStatus] = useState(null);
  const [checkingForUpdates, setCheckingForUpdates] = useState(false);
  useEffect(() => {
    let active = true;
    desktop.getAppInfo().then((info) => active && setAppInfo(info));
    desktop.getUpdateStatus().then((status) => active && setUpdateStatus(status));
    const removeUpdateStatus = desktop.onUpdateStatus((status) => active && setUpdateStatus(status));
    return () => { active = false; removeUpdateStatus(); };
  }, []);
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
  const updateFrequency = async (frequency) => {
    try {
      await onPatchSettings({ updateCheckFrequency: frequency });
      setUpdateStatus(await desktop.getUpdateStatus());
      setMessage(frequency === "never" ? "Automatic update checks turned off. You can still use Check now." : `Update checks will run ${frequency}.`);
    } catch (error) { setMessage(error.message); }
  };
  const checkNow = async () => {
    setCheckingForUpdates(true);
    setMessage("");
    try {
      const status = await desktop.checkForUpdates();
      setUpdateStatus(status);
      setMessage(status.updateAvailable ? `Version ${status.latestVersion} is available on GitHub.` : `You’re up to date with version ${status.currentVersion}.`);
    } catch (error) { setMessage(error.message); }
    finally { setCheckingForUpdates(false); }
  };
  const requestPreciseReminders = async () => {
    setMessage("");
    try {
      const result = await desktop.requestExactNotificationPermission();
      setAppInfo(await desktop.getAppInfo());
      setMessage(result.granted
        ? "Precise Android reminder timing is enabled. Your reminders have been refreshed."
        : "Precise timing was not enabled. Android will still deliver reminders, but may delay them to save battery.");
    } catch (error) { setMessage(error.message); }
  };
  const paused = appState.snoozeUntil > Date.now();
  const lastUpdateCheck = updateStatus?.lastCheckedAt ? new Date(updateStatus.lastCheckedAt).toLocaleString() : "Not checked yet";
  const nextUpdateCheck = settings.updateCheckFrequency === "never"
    ? "Automatic checks are off"
    : updateStatus?.nextCheckAt
      ? new Date(updateStatus.nextCheckAt).toLocaleString()
      : `Checks will run ${settings.updateCheckFrequency}`;
  const readingOptions = [
    ["focusMode", "Image-free focus mode", "Hide scenic backgrounds for a distraction-free reading view."],
    ["reducedMotion", "Reduced motion", "Disable transitions and animated scrolling for greater visual comfort."],
    ["autoScrollEnabled", "Auto-scroll", "Allow the reader to scroll devotional text automatically."],
    ...(!isMobilePlatform ? [["hoverPausesScroll", "Pause auto-scroll while hovering", "Temporarily pause automatic scrolling while the pointer is over the text."]] : []),
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
      <div><span>Make it yours</span><h1>Settings</h1><p>Everything is stored locally on this {isMobilePlatform ? "device" : "computer"}.</p></div>
      <button title="Close Settings and return to the compact daily Verse Card" className="settings-back-button" onClick={onBack}><ArrowLeft size={16} /><span><strong>Back to Verse Card</strong><small>Return to today’s compact Scripture card.</small></span></button>
    </div>
    <div className="settings-sections">
      {!isMobilePlatform && <div className="settings-group"><h2>Startup & tray</h2>
        <div className="setting-row"><div><h3>Launch at login</h3><p>Open today’s card when you sign in to Windows.</p></div><Toggle label="Launch at login" checked={settings.launchAtLogin} onChange={(launchAtLogin) => onPatchSettings({ launchAtLogin })} /></div>
        <div className="setting-row"><div><h3>Show card at startup</h3><p>Display today’s verse after Windows login.</p></div><Toggle label="Show card at startup" checked={settings.showStartupCard} onChange={(showStartupCard) => onPatchSettings({ showStartupCard })} /></div>
        <div className="setting-row"><div><h3>Start silently in tray</h3><p>Keep the startup card hidden while reminders remain active.</p></div><Toggle label="Start in tray" checked={settings.startInTray} onChange={(startInTray) => onPatchSettings({ startInTray })} /></div>
      </div>}
      <div className="settings-group"><h2>Gentle reminders</h2>
        <div className="setting-row"><div><h3>Notifications</h3><p>Master switch for all scheduled reminders.</p></div><Toggle label="Notifications" checked={settings.notificationsEnabled} onChange={(notificationsEnabled) => onPatchSettings({ notificationsEnabled })} /></div>
        <div className="setting-row"><div><h3>Notification sound</h3><p>Allow {isMobilePlatform ? "Android" : "Windows"} to play its notification sound.</p></div><Toggle label="Notification sound" checked={settings.notificationSound} onChange={(notificationSound) => onPatchSettings({ notificationSound })} /></div>
        {isMobilePlatform && <div className={`setting-row precise-reminders ${appInfo?.exactNotificationSupported ? "enabled" : ""}`}>
          <div><h3>Precise reminder timing</h3><p>{appInfo?.exactNotificationSupported ? "Allowed by Android. Fixed times and intervals are scheduled as precisely as the phone permits." : "Allow Alarms & reminders access so Android does not place broad delivery windows around your selected times."}</p></div>
          {appInfo?.exactNotificationSupported
            ? <span className="permission-status" role="status"><Check size={15} /> Enabled</span>
            : <button className="setting-action-button" title="Open Android’s Alarms & reminders access for Work Day with God" onClick={requestPreciseReminders}>Allow precise timing</button>}
        </div>}
        <div className="setting-row stack"><div><h3>Schedule style</h3><p>Choose daily reading times or a repeating devotional timer.</p></div><div className="segmented"><button title="Send Daily reading notifications at the individual times listed below" className={settings.reminderMode === "times" ? "selected" : ""} onClick={() => onPatchSettings({ reminderMode: "times" })}>Daily reading</button><button title="Repeat Devotional timer notifications after a chosen number of minutes" className={settings.reminderMode === "interval" ? "selected" : ""} onClick={() => onPatchSettings({ reminderMode: "interval" })}>Devotional timer</button></div></div>
        {settings.reminderMode === "times" ? <div className="time-list" title="Times when notifications may be sent on active weekdays">{settings.reminderTimes.map((time, index) => <label title={`Reminder scheduled for ${time}`} key={`${time}-${index}`}><input aria-label={`Reminder time ${index + 1}`} type="time" value={time} onChange={(event) => updateTime(index, event.target.value)} /><button title={`Remove the ${time} reminder`} aria-label={`Remove ${time}`} onClick={() => onPatchSettings({ reminderTimes: settings.reminderTimes.filter((_, itemIndex) => itemIndex !== index) })}><X size={12} /></button></label>)}<button title="Add another specific reminder time" onClick={() => onPatchSettings({ reminderTimes: [...settings.reminderTimes, "10:00"].sort() })}>+ Add time</button></div>
          : <label title="Set how many minutes pass between devotional timer notifications" className="field-label"><span><strong>Devotional timer interval</strong><small>Choose any whole-minute interval from 1 to 120 minutes.</small></span><select aria-label="Devotional timer interval in minutes" value={settings.intervalMinutes} onChange={(event) => onPatchSettings({ intervalMinutes: Number(event.target.value) })}>{intervalMinuteOptions.map((minutes) => <option key={minutes} value={minutes}>{minutes} {minutes === 1 ? "minute" : "minutes"}</option>)}</select></label>}
        <div className="weekday-picker" title="Choose which weekdays may send devotional reminders">{["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((label, day) => <button title={`${settings.activeDays.includes(day) ? "Disable" : "Enable"} reminders on ${label}`} key={label} className={settings.activeDays.includes(day) ? "selected" : ""} onClick={() => toggleDay(day)}>{label}</button>)}</div>
        {!settings.activeDays.length && <div className="schedule-warning" role="status">Select at least one day to enable scheduled reminders and the Verse Card timer.</div>}
        <div className="setting-row"><div><h3>Quiet hours</h3><p>No notifications during this period.</p></div><Toggle label="Quiet hours" checked={settings.quietHours.enabled} onChange={(enabled) => updateQuiet({ enabled })} /></div>
        {settings.quietHours.enabled && <div className="quiet-times" title="Notifications remain silent between these local times"><input aria-label="Quiet hours start time" type="time" value={settings.quietHours.start} onChange={(event) => updateQuiet({ start: event.target.value })} /><span>to</span><input aria-label="Quiet hours end time" type="time" value={settings.quietHours.end} onChange={(event) => updateQuiet({ end: event.target.value })} /></div>}
        <div className="snooze-row"><Bell size={18} /><span>{!settings.activeDays.length ? "Reminders are inactive until a day is selected" : paused ? `Paused until ${new Date(appState.snoozeUntil).toLocaleString()}` : "Reminders are active"}</span>{settings.activeDays.length > 0 && (paused ? <button title="End the current pause and resume scheduled reminders" onClick={() => onSnooze(0)}>Resume</button> : <><button title="Temporarily stop reminders for the next hour" onClick={() => onSnooze(Date.now() + 60 * 60 * 1000)}>Pause 1 hour</button><button title="Stop reminders until midnight tonight" onClick={() => { const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1); tomorrow.setHours(0,0,0,0); onSnooze(tomorrow.getTime()); }}>Until tomorrow</button></>)}</div>
        <label title="Set the snooze duration used by the Verse Card clock button" className="field-label"><span><strong>“Remind me later” duration</strong><small>Choose from 10 to 90 minutes in 10-minute increments.</small></span><select aria-label="Remind me later duration in minutes" value={settings.remindLaterMinutes} onChange={(event) => onPatchSettings({ remindLaterMinutes: Number(event.target.value) })}>{remindLaterOptions.map((minutes) => <option key={minutes} value={minutes}>{minutes} minutes</option>)}</select></label>
        {isMobilePlatform
          ? <div className="action-row notification-test-actions">
            <button disabled={!settings.notificationsEnabled} title="Display a sample Daily reading notification" onClick={() => run(async () => { const result = await desktop.testNotification("daily-reading"); if (!result.supported) throw new Error("Android notifications are unavailable or not permitted."); return result; }, "Daily reading test sent.")}>Test daily reading</button>
            <button disabled={!settings.notificationsEnabled} title="Display a sample Remind me later notification" onClick={() => run(async () => { const result = await desktop.testNotification("remind-later"); if (!result.supported) throw new Error("Android notifications are unavailable or not permitted."); return result; }, "Remind me later test sent.")}>Test remind me later</button>
            <button disabled={!settings.notificationsEnabled} title="Display a sample Devotional timer notification" onClick={() => run(async () => { const result = await desktop.testNotification("devotional-timer"); if (!result.supported) throw new Error("Android notifications are unavailable or not permitted."); return result; }, "Devotional timer test sent.")}>Test devotional timer</button>
          </div>
          : <div className="action-row"><button disabled={!settings.notificationsEnabled} title={settings.notificationsEnabled ? "Display a sample Windows notification using the current notification settings" : "Enable notifications before sending a test notification"} onClick={() => run(async () => { const result = await desktop.testNotification(); if (!result.supported) throw new Error("Windows notifications are unavailable or not permitted."); return result; }, "Test notification sent.")}>Send test notification</button></div>}
      </div>
      <div className="settings-group"><h2>Appearance & reading</h2>
        <div className="theme-options expanded">{["gold","blue","forest","burgundy","lavender","terracotta","sage","rose","teal","charcoal"].map((theme) => <button title={`Use the ${theme} accent colour throughout the app`} key={theme} className={settings.theme === theme ? "chosen" : ""} onClick={() => onPatchSettings({ theme })}><i className={theme} />{theme}</button>)}</div>
        <label title={`Choose an automatic sunrise-to-sunset appearance, follow ${isMobilePlatform ? "Android" : "Windows"}, or use a fixed mode`} className="field-label"><span><strong>Colour mode</strong><small>Auto uses light mode from local sunrise to sunset, then switches to dark.</small></span><select aria-label="Colour mode" value={settings.colorMode} onChange={(event) => onPatchSettings({ colorMode: event.target.value })}><option value="auto">Auto · sunrise to sunset</option><option value="system">Follow {isMobilePlatform ? "Android" : "Windows"}</option><option value="light">Light</option><option value="dark">Dark</option></select></label>
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
        <div className="action-row">{!isMobilePlatform && <button title="Open the Windows folder containing this app’s local settings and reading data" onClick={() => run(() => desktop.openDataFolder(), "Local data folder opened.")}>Open data folder</button>}<button title="Save settings, favourites, and reading history to a portable JSON backup" onClick={() => run(() => desktop.exportData(), "Backup exported.")}>Export backup</button><button title="Restore settings and reading data from a previously exported JSON backup" onClick={() => run(() => desktop.importData(), "Backup imported.")}>Import backup</button></div>
        <div className="action-row danger"><button title="Restore every setting to default and erase all local reading history and favourites" onClick={() => window.confirm("Reset all Work Day with God settings and history?") && run(async () => ({ state: await desktop.resetAll() }), "Application reset.")}>Reset entire application</button></div>
      </div>
      {!isMobilePlatform && <div className="settings-group"><h2>Updates</h2>
        <label title="Choose how often Work Day with God checks GitHub for a newer public release" className="field-label"><span><strong>Check for updates</strong><small>Uses GitHub’s public release information. No account, sign-in, or background service is required.</small></span><select aria-label="Automatic update check frequency" value={settings.updateCheckFrequency} onChange={(event) => updateFrequency(event.target.value)}><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option><option value="never">Never</option></select></label>
        <div className={`update-status-card ${updateStatus?.updateAvailable ? "available" : ""}`} role="status">
          <RefreshCw size={19} className={checkingForUpdates || updateStatus?.checking ? "checking" : ""} />
          <span><strong>{checkingForUpdates || updateStatus?.checking ? "Checking GitHub…" : updateStatus?.updateAvailable ? `Version ${updateStatus.latestVersion} is available` : updateStatus?.error ? "The last check could not be completed" : "Your update status"}</strong><small>Installed: {updateStatus?.currentVersion || appInfo?.version || "unknown"} · Last checked: {lastUpdateCheck}</small><small>{nextUpdateCheck}</small>{updateStatus?.error && <em>{updateStatus.error}</em>}</span>
        </div>
        <div className="action-row"><button disabled={checkingForUpdates || updateStatus?.checking} title="Check GitHub now for the latest public Work Day with God release" onClick={checkNow}>{checkingForUpdates || updateStatus?.checking ? "Checking…" : "Check now"}</button>{updateStatus?.updateAvailable && <button title={`Open the Work Day with God ${updateStatus.latestVersion} release on GitHub`} onClick={() => run(() => desktop.openUpdateRelease(), "Opened the latest release on GitHub.")}><ExternalLink size={12} />View update on GitHub</button>}</div>
      </div>}
      {isMobilePlatform && <div className="settings-group"><h2>Android updates</h2><div className="update-status-card"><RefreshCw size={19} /><span><strong>Installed version {appInfo?.version || "unknown"}</strong><small>Updates can be installed from a new Work Day with God APK or delivered through Google Play.</small></span></div></div>}
      <div className="settings-group"><h2>About</h2>
        <div className="about-settings">
          <div className="about-settings-intro"><BookOpen size={25} /><div><h3>Work Day with God</h3><strong>Work. Faith. Purpose.</strong><p>Work Day with God is a completely free Christian devotional app for Windows and Android, created to bring Scripture, reflection, prayer, and peaceful encouragement into your daily work routine. It works offline, requires no account or subscription, and stores your settings and reading activity locally on your device.</p></div></div>
          <div className="about-settings-details">
            <div><UserRound size={18} /><span><small>Author / Developer</small><strong>Kenneth Salmon</strong><em>Creator and developer of Work Day with God.</em></span></div>
            <div><MessageCircle size={18} /><span><small>Discord support</small><button title="Join the Work Day with God support server on Discord" onClick={() => desktop.openSupportDiscord()}>discord.gg/2UvdpY4JSW</button><em>For support, feedback, or bug reports.</em></span></div>
            <div><Info size={18} /><span><small>Application version</small><strong>{appInfo?.version ? `Version ${appInfo.version}` : "Work Day with God"}</strong><em>Notifications: {appInfo?.notificationSupported ? "supported" : "unavailable"}</em></span></div>
          </div>
          <p className="about-settings-footer">Daily devotional content © Work Day with God. Scripture quotations remain subject to their respective translation terms.</p>
        </div>
      </div>
      {message && <div className="settings-message" role="status">{message}</div>}
    </div>
  </section>;
}

function Reader({ catalogue, devotional, selectedDate, settings, appState, initialView, readingModeExitRequest, onReadingModeChange, onBack, onSelectDate, onPatchSettings, onPatchState, onSnooze }) {
  const [view, setView] = useState(initialView || "today");
  const [contentVisible, setContentVisible] = useState(true);
  const contentTimers = useRef([]);
  const [readingMode, setReadingMode] = useState(false);
  const resolvedColourMode = useResolvedColourMode(settings.colorMode);
  const navigateView = (nextView) => {
  const updateReadingMode = (active) => {
    setReadingMode(active);
    onReadingModeChange(active);
    desktop.setReadingMode(active);
  };
    if (nextView === view) return;
    for (const timer of contentTimers.current) window.clearTimeout(timer);
    if (readingMode) updateReadingMode(false);
    contentTimers.current = [];
    if (isMobilePlatform || settings.reducedMotion) {
      setContentVisible(true);
      setView(nextView);
      return;
    }
    setContentVisible(false);
    const swapTimer = window.setTimeout(() => {
      setView(nextView);
      const revealTimer = window.setTimeout(() => {
        setContentVisible(true);
        contentTimers.current = [];
      }, 30);
      contentTimers.current = [revealTimer];
    }, 190);
    contentTimers.current = [swapTimer];
  };
  useEffect(() => setView(initialView || "today"), [initialView]);
  useEffect(() => () => {
  useEffect(() => {
    if (readingMode) updateReadingMode(false);
  }, [readingModeExitRequest]);
    for (const timer of contentTimers.current) window.clearTimeout(timer);
  }, []);
    onReadingModeChange(false);
    desktop.setReadingMode(false);
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
    navigateView("today");
  };
  const showFuture = () => {
    onSelectDate(new Date());
    navigateView("future");
  };
  const showHistory = () => {
    const previousDate = new Date();
    previousDate.setDate(previousDate.getDate() - 1);
    onSelectDate(previousDate);
    navigateView("history");
  };
  const toggleFavourite = () => onPatchState({ favourites: favourite ? appState.favourites.filter((id) => id !== devotional.id) : [...appState.favourites, devotional.id] });
  const toggleComplete = () => {
    const completions = { ...appState.completions };
    if (completions[selectedDate]) delete completions[selectedDate];
    else completions[selectedDate] = Date.now();
    onPatchState({ completions });
  };
  return <main className={`reader-shell theme-${settings.theme} accent-${settings.theme} mode-${resolvedColourMode} ${settings.reducedMotion ? "reduced-motion" : ""} ${readingMode ? "devotional-reading-mode" : ""}`}>
    <header className="reader-header">
      <button title="Return to the compact Verse Card" className="wordmark" onClick={onBack}><span>WORK DAY</span><em>with God</em></button>
      <nav>
        <button title="Open the devotional assigned to today’s local date" className={view === "today" ? "selected" : ""} onClick={showToday}><BookOpen size={16} /> Today</button>
        {!settings.preventFutureDevotionals && <button title="Browse devotionals assigned to today and later dates" className={view === "future" || view === "future-reading" ? "selected" : ""} onClick={showFuture}><CalendarDays size={16} /> {isMobilePlatform ? "Future" : "Future Devotionals"}</button>}
        <button title="Browse devotional dates before today and review reading activity" className={view === "history" || view === "history-reading" ? "selected" : ""} onClick={showHistory}><History size={16} /> History</button>
        <button title="Configure reminders, appearance, reading behavior, and local data" className={`global-settings-nav ${view === "settings" ? "selected" : ""}`} onClick={() => navigateView("settings")}><Settings size={16} /> Settings</button>
      </nav><WindowControls />
    </header>
    <div className={`reader-content ${contentVisible ? "content-visible" : "content-hidden"} ${settings.reducedMotion ? "content-no-motion" : ""}`}>
      {view === "today" && <ReadingView devotional={devotional} selectedDate={selectedDate} dateScope="today" settings={settings} appState={appState} readingMode={readingMode} onReadingModeChange={updateReadingMode} onBack={onBack} onSettings={() => navigateView("settings")} onPatchSettings={onPatchSettings} onPatchState={onPatchState} onToggleFavourite={toggleFavourite} onToggleComplete={toggleComplete} onSelectDate={onSelectDate} />}
      {view === "history" && <CalendarView key="history" catalogue={catalogue} appState={appState} mode="history" onSelectDate={(date) => { onSelectDate(date); navigateView("history-reading"); }} />}
      {view === "history-reading" && <ReadingView devotional={devotional} selectedDate={selectedDate} dateScope="past" settings={settings} appState={appState} readingMode={readingMode} onReadingModeChange={updateReadingMode} onBack={onBack} onSettings={() => navigateView("settings")} onPatchSettings={onPatchSettings} onPatchState={onPatchState} onToggleFavourite={toggleFavourite} onToggleComplete={toggleComplete} onSelectDate={onSelectDate} />}
      {view === "future" && !settings.preventFutureDevotionals && <CalendarView key="future" catalogue={catalogue} appState={appState} mode="future" onSelectDate={(date) => { onSelectDate(date); navigateView("future-reading"); }} />}
      {view === "future-reading" && !settings.preventFutureDevotionals && <ReadingView devotional={devotional} selectedDate={selectedDate} dateScope="future" settings={settings} appState={appState} readingMode={readingMode} onReadingModeChange={updateReadingMode} onBack={onBack} onSettings={() => navigateView("settings")} onPatchSettings={onPatchSettings} onPatchState={onPatchState} onToggleFavourite={toggleFavourite} onToggleComplete={toggleComplete} onSelectDate={onSelectDate} />}
      {view === "settings" && <SettingsView settings={settings} appState={appState} onBack={onBack} onPatchSettings={onPatchSettings} onSnooze={onSnooze} onPatchState={onPatchState} />}
    </div>
  </main>;
}

export default function App() {
  const [catalogue, setCatalogue] = useState([]);
  const [appState, setAppState] = useState(null);
  const [mode, setMode] = useState("card");
  const [surfaceVisible, setSurfaceVisible] = useState(true);
  const [readerView, setReaderView] = useState("today");
  const [selectedDate, setSelectedDate] = useState(() => isoDate());
  const [startupError, setStartupError] = useState("");
  const stateRevision = useRef(0);
  const [readingModeExitRequest, setReadingModeExitRequest] = useState(0);
  const modeRef = useRef(mode);
  const reducedMotion = useRef(false);
  const readingModeRef = useRef(false);
  const surfaceTimers = useRef([]);
  reducedMotion.current = Boolean(appState?.settings.reducedMotion);
  modeRef.current = mode;
  const selectedCalendarDate = useMemo(() => new Date(`${selectedDate}T12:00:00`), [selectedDate]);
  const devotional = catalogue.length ? devotionalForDate(catalogue, selectedCalendarDate) : null;
  const transitionSurface = (nextMode, update) => {
    for (const timer of surfaceTimers.current) window.clearTimeout(timer);
    surfaceTimers.current = [];
    if (isMobilePlatform || reducedMotion.current) {
      setSurfaceVisible(true);
      update();
      desktop.setMode(nextMode);
      return;
    }
    setSurfaceVisible(false);
    const swapTimer = window.setTimeout(() => {
      flushSync(update);
      desktop.setMode(nextMode);
      const revealTimer = window.setTimeout(() => {
        setSurfaceVisible(true);
        surfaceTimers.current = [];
      }, 220);
      surfaceTimers.current = [revealTimer];
    }, 260);
    surfaceTimers.current = [swapTimer];
  };

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
      if (view === "card") {
        transitionSurface("card", () => {
          setSelectedDate(isoDate());
          setMode("card");
        });
        return;
      }
      if (view === "back") {
        if (modeRef.current === "card") {
        if (readingModeRef.current) {
          readingModeRef.current = false;
          setReadingModeExitRequest((request) => request + 1);
          return;
        }
          desktop.exitApp();
          return;
        }
        transitionSurface("card", () => {
          setSelectedDate(isoDate());
          setMode("card");
        });
        return;
      }
      transitionSurface("reader", () => {
        setReaderView(view === "settings" ? "settings" : "today");
        if (view !== "settings") setSelectedDate(isoDate());
        setMode("reader");
      });
    });
    const removeDate = desktop.onOpenDate((id) => {
      const year = new Date().getFullYear();
      transitionSurface("reader", () => {
        setSelectedDate(/^\d{4}-\d{2}-\d{2}$/.test(id) ? id : `${year}-${id}`);
        setReaderView("today");
        setMode("reader");
      });
    });
    const removeState = desktop.onStateChanged((state) => {
      stateRevision.current += 1;
      setAppState(state);
    });
    return () => {
      active = false;
      for (const timer of surfaceTimers.current) window.clearTimeout(timer);
      removeNavigate(); removeDate(); removeState();
    };
  }, []);

  useEffect(() => {
    const rollover = setInterval(() => {
      if (mode === "card" && (appState?.settings.automaticDailyContent ?? true)) setSelectedDate(isoDate());
    }, 60_000);
    return () => clearInterval(rollover);
  }, [mode, appState?.settings.automaticDailyContent]);

  if (startupError) return <main className="loading-screen">{startupError}</main>;
  if (!devotional || !appState) return <main className="loading-screen">Preparing today’s quiet moment…</main>;
  const openReader = (view = "today") => {
    transitionSurface("reader", () => { setReaderView(view); setMode("reader"); });
  };
  const closeReader = () => {
    transitionSurface("card", () => { setSelectedDate(isoDate()); setMode("card"); });
  };
  const patchSettings = async (patch) => {
    const revision = ++stateRevision.current;
    setAppState((current) => ({
      ...current,
      settings: {
        ...current.settings,
        ...patch,
        ...(patch.quietHours ? { quietHours: { ...current.settings.quietHours, ...patch.quietHours } } : {}),
      },
    }));
    try {
      const persisted = await desktop.updateSettings(patch);
      if (revision === stateRevision.current) setAppState(persisted);
      return persisted;
    } catch (error) {
      if (revision === stateRevision.current) setAppState(await desktop.getState());
      throw error;
    }
  };
  const patchState = async (patch, replace = false) => {
    const revision = ++stateRevision.current;
    if (replace) {
      setAppState(patch);
      return patch;
    }
    setAppState((current) => ({ ...current, ...patch }));
    try {
      const persisted = await desktop.updateState(patch);
      if (revision === stateRevision.current) setAppState(persisted);
      return persisted;
    } catch (error) {
      if (revision === stateRevision.current) setAppState(await desktop.getState());
      throw error;
    }
  };
  const onSnooze = async (until) => { await desktop.snooze(until); setAppState(await desktop.getState()); };
  const onRemindLater = async () => {
    const until = Date.now() + appState.settings.remindLaterMinutes * 60 * 1000;
    setAppState(await desktop.remindLater(until));
    return until;
  };
  const favourite = appState.favourites.includes(devotional.id);
  return <div className={`app-surface ${surfaceVisible ? "surface-visible" : "surface-hidden"} ${appState.settings.reducedMotion ? "surface-no-motion" : ""}`}>
    {mode === "card"
      ? <Card devotional={devotional} favourite={favourite} streak={calculateStreak(appState.completions)} settings={appState.settings}
        onRead={openReader} onSnooze={onRemindLater}
        onFavourite={() => patchState({ favourites: favourite ? appState.favourites.filter((id) => id !== devotional.id) : [...appState.favourites, devotional.id] })} />
      : <Reader catalogue={catalogue} devotional={devotional} selectedDate={selectedDate} settings={appState.settings} appState={appState}
        initialView={readerView} readingModeExitRequest={readingModeExitRequest} onReadingModeChange={(active) => { readingModeRef.current = active; }} onBack={closeReader} onSelectDate={(date) => setSelectedDate(isoDate(date))}
        onPatchSettings={patchSettings} onPatchState={patchState} onSnooze={onSnooze} />}
  </div>;
}
