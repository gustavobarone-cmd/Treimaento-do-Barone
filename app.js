/* Treinamento - Barone • v6.2
   - Alongamento Pré/Pós (banco 146 + personalizados) + vídeo do YouTube
   - Judô (circuito por tempo) + checklist manual de estações
   - Treino do Alberto (pack importável) + semana + vídeo do YouTube embutido
   - Timer + regressiva 5→1 (beep/voz opcional)
   - Histórico + export/import + sessão salva
   - PWA (manifest + service worker)
*/

// ---------------- Storage ----------------
const STORAGE = {
  // migrations (v6.1)
  OLD_CUSTOM:   "stretch_v6_custom_items",
  OLD_SELECTED: "stretch_v6_selected_ids",
  OLD_SETTINGS: "stretch_v6_settings",
  OLD_LASTSEQ:  "stretch_v6_last_sequence",
  OLD_SAVED:    "stretch_v6_saved_session",
  OLD_HISTORY:  "stretch_v6_history",
  OLD_OVERRIDES:"stretch_v6_video_overrides",

  // v6.2
  STRETCH_CUSTOM:   "tb_v62_stretch_custom",
  STRETCH_SELECTED: "tb_v62_stretch_selected",

  SETTINGS:   "tb_v62_settings",
  LASTSEQ:    "tb_v62_last_sequence",
  SAVED:      "tb_v62_saved_session",
  HISTORY:    "tb_v62_history",

  VIDEO_OVERRIDES: "tb_v62_video_overrides",

  JUDO_BANK:     "tb_v62_judo_bank",
  JUDO_SELECTED: "tb_v62_judo_selected",

  ALB_IMPORTED: "tb_v62_alberto_imported",
  ALB_LOGS:     "tb_v62_alberto_logs",
  ALB_STATUS:   "tb_v62_alberto_status"
};

const $ = (id) => document.getElementById(id);

// ---------------- DOM ----------------
const els = {
  tabs: Array.from(document.querySelectorAll(".tab")),
  panels: Array.from(document.querySelectorAll(".tabPanel")),

  statusPill: $("statusPill"),
  installBtn: $("installBtn"),

  // session config
  programType: $("programType"),
  sessionName: $("sessionName"),

  cfgStretch: $("cfg-stretch"),
  cfgJudo: $("cfg-judo"),
  cfgAlberto: $("cfg-alberto"),

  // stretch
  mode: $("mode"),
  totalMinutes: $("totalMinutes"),
  stretchSeconds: $("stretchSeconds"),
  restSeconds: $("restSeconds"),
  startSide: $("startSide"),
  unilateralMode: $("unilateralMode"),

  // judo
  judoWorkSec: $("judoWorkSec"),
  judoRestSec: $("judoRestSec"),
  judoRounds: $("judoRounds"),
  judoRestRoundsSec: $("judoRestRoundsSec"),
  judoShuffle: $("judoShuffle"),
  judoQuickName: $("judoQuickName"),
  judoQuickAddBtn: $("judoQuickAddBtn"),
  judoSelectAllBtn: $("judoSelectAllBtn"),
  judoSelectNoneBtn: $("judoSelectNoneBtn"),
  judoChecklist: $("judoChecklist"),

  // alberto
  albCycle: $("albCycle"),
  albPhase: $("albPhase"),
  albWeek: $("albWeek"),
  albSessionSelect: $("albSessionSelect"),
  albImportFile: $("albImportFile"),
  albResetPackBtn: $("albResetPackBtn"),
  albWeekPill: $("albWeekPill"),

  // voice / common
  beepEnabled: $("beepEnabled"),
  speakEndEnabled: $("speakEndEnabled"),
  speakCountdownEnabled: $("speakCountdownEnabled"),
  announceStepEnabled: $("announceStepEnabled"),
  voicePref: $("voicePref"),
  voiceSelect: $("voiceSelect"),

  generateBtn: $("generateBtn"),
  startBtn: $("startBtn"),
  saveSessionBtn: $("saveSessionBtn"),

  summaryLine: $("summaryLine"),
  estimatedCount: $("estimatedCount"),

  // player
  stepCounter: $("stepCounter"),
  chipPhase: $("chipPhase"),
  nowTitle: $("nowTitle"),
  nowSub: $("nowSub"),
  timerBig: $("timerBig"),
  timerSub: $("timerSub"),

  youtubeFrame: $("youtubeFrame"),
  videoFallback: $("videoFallback"),
  btnOpenSearch: $("btnOpenSearch"),

  progressIndex: $("progressIndex"),
  progressTotal: $("progressTotal"),
  nextName: $("nextName"),
  barFill: $("barFill"),

  countdownLabel: $("countdownLabel"),
  countdownText: $("countdownText"),

  pauseBtn: $("pauseBtn"),
  prevBtn: $("prevBtn"),
  nextBtn: $("nextBtn"),
  stopBtn: $("stopBtn"),
  copyBtn: $("copyBtn"),

  sessionStatus: $("sessionStatus"),

  // alberto log
  albertoLogBox: $("albertoLogBox"),
  albLogMeta: $("albLogMeta"),
  albVideoLink: $("albVideoLink"),
  albLoad: $("albLoad"),
  albRepsDone: $("albRepsDone"),
  albNotes: $("albNotes"),
  albSaveLogBtn: $("albSaveLogBtn"),
  albClearLogBtn: $("albClearLogBtn"),

  // sequence
  sequenceMeta: $("sequenceMeta"),
  sequenceList: $("sequenceList"),

  // bank
  bankMeta: $("bankMeta"),
  bankType: $("bankType"),
  bankSearch: $("bankSearch"),

  bankStretchWrap: $("bank-stretch"),
  bankPhaseFilter: $("bankPhaseFilter"),
  bankRegionFilter: $("bankRegionFilter"),
  bankLevelFilter: $("bankLevelFilter"),
  selectAllBtn: $("selectAllBtn"),
  selectNoneBtn: $("selectNoneBtn"),
  deleteCustomBtn: $("deleteCustomBtn"),
  bankList: $("bankList"),

  newNamePt: $("newNamePt"),
  newPhase: $("newPhase"),
  newRegion: $("newRegion"),
  newSides: $("newSides"),
  newYoutubeId: $("newYoutubeId"),
  newSearchQuery: $("newSearchQuery"),
  addCustomBtn: $("addCustomBtn"),
  resetCustomBtn: $("resetCustomBtn"),

  bankJudoWrap: $("bank-judo"),
  judoNewStation: $("judoNewStation"),
  judoAddStationBtn: $("judoAddStationBtn"),
  judoBankList: $("judoBankList"),

  bankAlbertoWrap: $("bank-alberto"),
  albertoBankList: $("albertoBankList"),

  // history
  historyMeta: $("historyMeta"),
  historyList: $("historyList"),
  exportBtn: $("exportBtn"),
  importFile: $("importFile"),
  clearHistoryBtn: $("clearHistoryBtn"),
  loadSavedBtn: $("loadSavedBtn"),
  deleteSavedBtn: $("deleteSavedBtn"),
  savedHint: $("savedHint")
};

// ---------------- State ----------------
let stretchBank = null;
let stretchItems = [];
let stretchSelected = new Set();

let judoStations = [];
let judoSelected = new Set();

let albertoIndex = [];
let albertoSessions = new Map();
let albertoExercises = [];

let sequence = [];
let activeProgram = "stretch";
let activeSessionName = "";
let activeSessionId = "";

let currentIndex = 0;
let isRunning = false;
let isPaused = false;
let intervalId = null;
let remaining = 0;
let stepTotal = 0;

let sessionLogs = {};
let deferredInstallPrompt = null;

// ---------------- Helpers ----------------
function saveJson(key, value){ localStorage.setItem(key, JSON.stringify(value)); }
function loadJson(key, fallback){
  try{ const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; }
  catch{ return fallback; }
}

function nowIso(){ return new Date().toISOString(); }
function pad2(n){ return String(n).padStart(2,"0"); }
function formatTime(sec){
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s/60);
  const r = s%60;
  return `${pad2(m)}:${pad2(r)}`;
}
function escapeHtml(str){
  return String(str ?? "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

function setStatus(text, kind="neutral"){
  els.statusPill.textContent = text;
  const bg = ({
    neutral: "rgba(255,255,255,.06)",
    good: "rgba(34,197,94,.18)",
    warn: "rgba(245,158,11,.18)",
    bad:  "rgba(239,68,68,.18)"
  })[kind] || "rgba(255,255,255,.06)";
  els.statusPill.style.background = bg;
}

function shuffle(arr){
  const a = [...arr];
  for (let i=a.length-1;i>0;i--){
    const j = Math.floor(Math.random()*(i+1));
    [a[i],a[j]] = [a[j],a[i]];
  }
  return a;
}

function clampInt(v, min, max, fallback){
  const n = parseInt(String(v||""), 10);
  if (Number.isNaN(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

// ---------------- YouTube helpers ----------------
function parseYouTubeId(text){
  const t = (text || "").trim();
  if (!t) return null;
  if (/^[a-zA-Z0-9_-]{11}$/.test(t)) return t;
  try{
    const u = new URL(t);
    if ((u.hostname||"").includes("youtu.be")){
      const id = u.pathname.split("/").filter(Boolean)[0];
      if (id && /^[a-zA-Z0-9_-]{11}$/.test(id)) return id;
    }
    if ((u.hostname||"").includes("youtube.com")){
      const v = u.searchParams.get("v");
      if (v && /^[a-zA-Z0-9_-]{11}$/.test(v)) return v;
      const parts = u.pathname.split("/").filter(Boolean);
      const i1 = parts.indexOf("embed");
      if (i1>=0 && parts[i1+1] && /^[a-zA-Z0-9_-]{11}$/.test(parts[i1+1])) return parts[i1+1];
      const i2 = parts.indexOf("shorts");
      if (i2>=0 && parts[i2+1] && /^[a-zA-Z0-9_-]{11}$/.test(parts[i2+1])) return parts[i2+1];
    }
  }catch{}
  return null;
}

function getVideoOverrides(){
  const v62 = loadJson(STORAGE.VIDEO_OVERRIDES, null);
  if (v62 && typeof v62 === "object") return v62;
  const old = loadJson(STORAGE.OLD_OVERRIDES, null);
  if (old && typeof old === "object"){
    saveJson(STORAGE.VIDEO_OVERRIDES, old);
    return old;
  }
  return {};
}

function setVideoOverride(key, youtubeId){
  const all = getVideoOverrides();
  all[key] = { youtubeId: youtubeId || null, updatedAt: nowIso() };
  saveJson(STORAGE.VIDEO_OVERRIDES, all);
}

function getOverrideId(key){
  const all = getVideoOverrides();
  const o = all[key];
  return o && o.youtubeId ? o.youtubeId : null;
}

function setYoutubeById(youtubeId, startSeconds=0){
  if (!youtubeId){
    els.youtubeFrame.src = "";
    els.youtubeFrame.classList.add("hidden");
    els.videoFallback.classList.remove("hidden");
    return;
  }
  const start = startSeconds ? `&start=${Math.max(0, Math.floor(startSeconds))}` : "";
  const url = `https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&mute=1&rel=0&modestbranding=1&playsinline=1${start}`;
  els.youtubeFrame.src = url;
  els.youtubeFrame.classList.remove("hidden");
  els.videoFallback.classList.add("hidden");
}

function openSearch(){
  const st = currentStep();
  if (!st || st.type === "rest") return;
  const name = st.item?.name_pt || st.item?.name_en || "";
  const q = st.item?.video?.searchQuery || name;
  const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;
  window.open(url, "_blank", "noopener,noreferrer");
}

// ---------------- Speech ----------------
let voiceList = [];
function refreshVoices(){
  try{ voiceList = window.speechSynthesis.getVoices() || []; }catch{ voiceList = []; }
  els.voiceSelect.innerHTML = "";
  const opt0 = document.createElement("option");
  opt0.value = "";
  opt0.textContent = "(Automática)";
  els.voiceSelect.appendChild(opt0);
  voiceList.forEach(v=>{
    const opt = document.createElement("option");
    opt.value = v.name;
    opt.textContent = `${v.name} • ${v.lang}`;
    els.voiceSelect.appendChild(opt);
  });
}

function chooseVoice(){
  const pref = els.voicePref.value;
  const specific = els.voiceSelect.value;
  if (pref === "off") return null;
  if (specific){
    const v = voiceList.find(x=>x.name===specific);
    if (v) return v;
  }
  const pt = voiceList.filter(v => (v.lang||"").toLowerCase().startsWith("pt"));
  const pool = pt.length ? pt : voiceList;
  if (pref === "female") return pool.find(v=>/female|feminina|mulher/i.test(v.name)) || pool[0] || null;
  if (pref === "male") return pool.find(v=>/male|masculina|homem/i.test(v.name)) || pool[0] || null;
  return pool[0] || null;
}

function speak(text){
  try{
    if (!('speechSynthesis' in window)) return;
    if (els.voicePref.value === "off") return;
    const u = new SpeechSynthesisUtterance(text);
    const v = chooseVoice();
    if (v) u.voice = v;
    u.rate = 1.0; u.pitch = 1.0;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  }catch{}
}

function speakCountdown(n){ if (els.speakCountdownEnabled.checked) speak(String(n)); }
function speakIfEnabled(text){ if (els.speakEndEnabled.checked) speak(text); }
function speakStep(step){
  if (!els.announceStepEnabled.checked) return;
  if (!step) return;
  if (step.type === "rest") return speak(step.restLabel || "Intervalo");
  const name = step.item?.name_pt || step.item?.name_en || "Passo";
  speak(name);
}

// ---------------- Beep ----------------
let audioCtx = null;
function ensureAudio(){
  try{
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === "suspended") audioCtx.resume().catch(()=>{});
  }catch{}
}

function beep(type="count"){
  if (!els.beepEnabled.checked) return;
  try{
    ensureAudio();
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = "sine";
    o.frequency.value = (type === "end") ? 660 : 880;
    g.gain.value = (type === "end") ? 0.10 : 0.07;
    o.connect(g); g.connect(audioCtx.destination);
    o.start();
    setTimeout(()=> o.stop(), (type === "end") ? 160 : 110);
  }catch{}
}

// ---------------- Tabs ----------------
function setActiveTab(name){
  els.tabs.forEach(btn=>{
    const active = btn.dataset.tab === name;
    btn.classList.toggle("active", active);
    btn.setAttribute("aria-selected", active ? "true" : "false");
  });
  els.panels.forEach(p=> p.classList.toggle("active", p.id === `tab-${name}`));
}

// ---------------- Settings ----------------
function defaultSettings(){
  return {
    programType: "stretch",
    sessionName: "",
    mode: "pre",
    totalMinutes: 8,
    stretchSeconds: 30,
    restSeconds: 5,
    startSide: "L",
    unilateralMode: "off",
    judoWorkSec: 40,
    judoRestSec: 20,
    judoRounds: 3,
    judoRestRoundsSec: 60,
    judoShuffle: false,
    albCycle: "Ciclo II",
    albPhase: "Fase 3",
    albWeek: 11,
    albSessionId: "",
    voicePref: "auto",
    voiceName: "",
    beepEnabled: true,
    speakEndEnabled: true,
    speakCountdownEnabled: false,
    announceStepEnabled: true
  };
}

function getSettings(){
  const s = loadJson(STORAGE.SETTINGS, null);
  return { ...defaultSettings(), ...(s||{}) };
}

function setProgramUI(type){
  activeProgram = type;
  els.cfgStretch.classList.toggle("hidden", type !== "stretch");
  els.cfgJudo.classList.toggle("hidden", type !== "judo");
  els.cfgAlberto.classList.toggle("hidden", type !== "alberto");
  updateSummary();
}

function applySettingsToUI(){
  const s = getSettings();
  els.programType.value = s.programType;
  els.sessionName.value = s.sessionName || "";

  els.mode.value = s.mode;
  els.totalMinutes.value = String(s.totalMinutes);
  els.stretchSeconds.value = String(s.stretchSeconds);
  els.restSeconds.value = String(s.restSeconds);
  els.startSide.value = s.startSide;
  els.unilateralMode.value = s.unilateralMode;

  els.judoWorkSec.value = String(s.judoWorkSec);
  els.judoRestSec.value = String(s.judoRestSec);
  els.judoRounds.value = String(s.judoRounds);
  els.judoRestRoundsSec.value = String(s.judoRestRoundsSec);
  els.judoShuffle.checked = !!s.judoShuffle;

  els.albCycle.value = s.albCycle;
  els.albPhase.value = s.albPhase;
  els.albWeek.value = String(s.albWeek);

  els.beepEnabled.checked = !!s.beepEnabled;
  els.speakEndEnabled.checked = !!s.speakEndEnabled;
  els.speakCountdownEnabled.checked = !!s.speakCountdownEnabled;
  els.announceStepEnabled.checked = !!s.announceStepEnabled;

  els.voicePref.value = s.voicePref;
  if (s.voiceName) els.voiceSelect.value = s.voiceName;

  setProgramUI(s.programType);
}

function collectSettingsFromUI(){
  const s = getSettings();
  const out = { ...s };

  out.programType = els.programType.value;
  out.sessionName = (els.sessionName.value || "").trim();

  out.mode = els.mode.value;
  out.totalMinutes = clampInt(els.totalMinutes.value, 1, 180, 8);
  out.stretchSeconds = clampInt(els.stretchSeconds.value, 5, 600, 30);
  out.restSeconds = clampInt(els.restSeconds.value, 0, 600, 5);
  out.startSide = els.startSide.value;
  out.unilateralMode = els.unilateralMode.value;

  out.judoWorkSec = clampInt(els.judoWorkSec.value, 5, 600, 40);
  out.judoRestSec = clampInt(els.judoRestSec.value, 0, 600, 20);
  out.judoRounds = clampInt(els.judoRounds.value, 1, 20, 3);
  out.judoRestRoundsSec = clampInt(els.judoRestRoundsSec.value, 0, 600, 60);
  out.judoShuffle = !!els.judoShuffle.checked;

  out.albCycle = (els.albCycle.value||"").trim() || "Ciclo II";
  out.albPhase = (els.albPhase.value||"").trim() || "Fase 3";
  out.albWeek = clampInt(els.albWeek.value, 1, 99, 11);
  out.albSessionId = els.albSessionSelect.value || "";

  out.beepEnabled = !!els.beepEnabled.checked;
  out.speakEndEnabled = !!els.speakEndEnabled.checked;
  out.speakCountdownEnabled = !!els.speakCountdownEnabled.checked;
  out.announceStepEnabled = !!els.announceStepEnabled.checked;

  out.voicePref = els.voicePref.value;
  out.voiceName = els.voiceSelect.value || "";

  saveJson(STORAGE.SETTINGS, out);
  return out;
}

function estimateCount(totalMinutes, stretchSeconds, restSeconds){
  const total = totalMinutes*60;
  const unit = stretchSeconds + restSeconds;
  if (unit <= 0) return 0;
  return Math.max(0, Math.floor((total + restSeconds) / unit));
}

function updateSummary(){
  const s = collectSettingsFromUI();
  if (s.programType === "stretch"){
    const est = estimateCount(s.totalMinutes, s.stretchSeconds, s.restSeconds);
    els.summaryLine.textContent = `${s.mode === "pre" ? "Pré" : "Pós"} • ${s.totalMinutes} min • ${s.stretchSeconds}s + ${s.restSeconds}s • lados: ${s.unilateralMode}`;
    els.estimatedCount.textContent = String(est);
    return;
  }
  if (s.programType === "judo"){
    els.summaryLine.textContent = `Judô • ${judoSelected.size} estações • ${s.judoWorkSec}s / ${s.judoRestSec}s • ${s.judoRounds} rounds`;
    els.estimatedCount.textContent = "—";
    return;
  }
  const sessName = (albertoIndex.find(x=>x.id===s.albSessionId)?.name) || "—";
  els.summaryLine.textContent = `Alberto • ${s.albCycle} • ${s.albPhase} • Semana ${s.albWeek} • ${sessName}`;
  els.estimatedCount.textContent = "—";
}

// ---------------- Data: Migrations ----------------
function migrateV61(){
  const hasNew = localStorage.getItem(STORAGE.STRETCH_CUSTOM) || localStorage.getItem(STORAGE.SETTINGS);
  if (hasNew) return;

  const oldCustom = localStorage.getItem(STORAGE.OLD_CUSTOM);
  const oldSelected = localStorage.getItem(STORAGE.OLD_SELECTED);
  const oldSettings = localStorage.getItem(STORAGE.OLD_SETTINGS);
  const oldLast = localStorage.getItem(STORAGE.OLD_LASTSEQ);
  const oldSaved = localStorage.getItem(STORAGE.OLD_SAVED);
  const oldHistory = localStorage.getItem(STORAGE.OLD_HISTORY);

  if (oldCustom) localStorage.setItem(STORAGE.STRETCH_CUSTOM, oldCustom);
  if (oldSelected) localStorage.setItem(STORAGE.STRETCH_SELECTED, oldSelected);

  if (oldSettings){
    try{
      const s = JSON.parse(oldSettings);
      saveJson(STORAGE.SETTINGS, { ...defaultSettings(), ...s, programType:"stretch" });
    }catch{}
  }

  if (oldLast) localStorage.setItem(STORAGE.LASTSEQ, oldLast);
  if (oldSaved) localStorage.setItem(STORAGE.SAVED, oldSaved);
  if (oldHistory) localStorage.setItem(STORAGE.HISTORY, oldHistory);
}

// ---------------- Data: Stretch bank ----------------
async function loadStretchBank(){
  const resp = await fetch("./stretches_bank_v1.json", { cache: "no-store" });
  stretchBank = await resp.json();

  const base = Array.isArray(stretchBank?.items) ? stretchBank.items : [];
  const custom = loadJson(STORAGE.STRETCH_CUSTOM, []);
  const customNorm = Array.isArray(custom) ? custom.filter(x=>x && x.id).map(x=>({
    ...x,
    custom: true,
    video: x.video || {
      provider: "youtube",
      youtubeId: parseYouTubeId(x.youtubeId) || null,
      searchQuery: x.searchQuery || (x.name_en || x.name_pt || "")
    }
  })) : [];

  const merged = [...base, ...customNorm];
  const seen = new Set();
  stretchItems = merged.filter(it=>{
    if (!it.id || seen.has(it.id)) return false;
    seen.add(it.id);
    return true;
  });

  // apply overrides (key is stretch item id)
  const ov = getVideoOverrides();
  stretchItems = stretchItems.map(it=>{
    const o = ov[it.id];
    if (!o || !o.youtubeId) return it;
    const baseVideo = it.video || { provider:"youtube", youtubeId:null, searchQuery: it.name_en || it.name_pt || it.id };
    return { ...it, video: { ...baseVideo, youtubeId: o.youtubeId } };
  });

  // selection
  const stored = loadJson(STORAGE.STRETCH_SELECTED, null);
  if (Array.isArray(stored) && stored.length){
    const valid = new Set(stretchItems.map(x=>x.id));
    stretchSelected = new Set(stored.filter(id=>valid.has(id)));
  } else {
    stretchSelected = new Set(stretchItems.map(x=>x.id));
  }
  saveJson(STORAGE.STRETCH_SELECTED, Array.from(stretchSelected));

  buildRegionOptions();
}

function buildRegionOptions(){
  const regions = Array.from(new Set(stretchItems.map(i=>i.region).filter(Boolean))).sort();
  els.bankRegionFilter.innerHTML = `<option value="all" selected>Todas</option>`;
  regions.forEach(r=>{
    const opt = document.createElement("option");
    opt.value = r;
    opt.textContent = r;
    els.bankRegionFilter.appendChild(opt);
  });
}

// ---------------- Data: Stretch bank ----------------
async function loadStretchBank(){
  const resp = await fetch("./stretches_bank_v1.json", { cache: "no-store" });
  stretchBank = await resp.json();

  const base = Array.isArray(stretchBank && stretchBank.items) ? stretchBank.items : [];
  const custom = loadJson(STORAGE.STRETCH_CUSTOM, []);
  const customList = Array.isArray(custom) ? custom : [];

  // merge
  const merged = [...base, ...customList.map(x=>({
    ...x,
    custom: true,
    video: x.video || { provider: "youtube", youtubeId: parseYouTubeId(x.youtubeId) || null, searchQuery: x.searchQuery || (x.name_en || x.name_pt || "") }
  }))];

  const seen = new Set();
  stretchItems = merged.filter(it => it && it.id && !seen.has(it.id) && (seen.add(it.id), true));

  // apply overrides (key: item id)
  const ov = getVideoOverrides();
  stretchItems = stretchItems.map(it => {
    const o = ov[it.id];
    if (!o || !o.youtubeId) return it;
    const v = it.video || { provider: "youtube", youtubeId: null, searchQuery: it.name_en || it.name_pt || it.id };
    return { ...it, video: { ...v, youtubeId: o.youtubeId } };
  });

  // selection
  const stored = loadJson(STORAGE.STRETCH_SELECTED, null);
  if (Array.isArray(stored) && stored.length){
    const valid = new Set(stretchItems.map(x=>x.id));
    stretchSelected = new Set(stored.filter(id=>valid.has(id)));
  } else {
    stretchSelected = new Set(stretchItems.map(x=>x.id));
  }
  saveJson(STORAGE.STRETCH_SELECTED, Array.from(stretchSelected));

  buildRegionOptions();
}

function buildRegionOptions(){
  const regions = Array.from(new Set(stretchItems.map(i=>i.region).filter(Boolean))).sort();
  els.bankRegionFilter.innerHTML = `<option value="all" selected>Todas</option>`;
  regions.forEach(r => {
    const opt = document.createElement("option");
    opt.value = r;
    opt.textContent = r;
    els.bankRegionFilter.appendChild(opt);
  });
}

// ---------------- Data: Judô bank ----------------
async function loadJudoBank(){
  let base = [];
  try{
    const resp = await fetch("./judo_bank_v1.json", { cache: "no-store" });
    const j = await resp.json();
    base = Array.isArray(j && j.stations) ? j.stations : [];
  }catch{ base = []; }

  const stored = loadJson(STORAGE.JUDO_BANK, null);
  judoStations = Array.isArray(stored) ? stored : base;

  const sel = loadJson(STORAGE.JUDO_SELECTED, null);
  if (Array.isArray(sel) && sel.length){
    const valid = new Set(judoStations.map(s=>s.id));
    judoSelected = new Set(sel.filter(id=>valid.has(id)));
  } else {
    judoSelected = new Set(judoStations.map(s=>s.id));
    saveJson(STORAGE.JUDO_SELECTED, Array.from(judoSelected));
  }
}

function saveJudoBank(){
  saveJson(STORAGE.JUDO_BANK, judoStations);
}

// ---------------- Data: Alberto pack ----------------
async function loadAlbertoPack(){
  let idx = [];
  try{
    const resp = await fetch("./treinos/index.json", { cache: "no-store" });
    const j = await resp.json();
    idx = Array.isArray(j && j.programs && j.programs.alberto) ? j.programs.alberto : [];
  }catch{ idx = []; }

  let ex = [];
  try{
    const resp = await fetch("./treinos/exercises/alberto_exercises.json", { cache: "no-store" });
    const j = await resp.json();
    ex = Array.isArray(j && j.exercises) ? j.exercises : (Array.isArray(j) ? j : []);
  }catch{ ex = []; }

  const imp = loadJson(STORAGE.ALB_IMPORTED, { sessions: [], exercises: [] });
  const impSessions = Array.isArray(imp && imp.sessions) ? imp.sessions : [];
  const impExercises = Array.isArray(imp && imp.exercises) ? imp.exercises : [];

  const byId = new Map();
  [...idx, ...impSessions].forEach(s=>{ if (s && s.id) byId.set(s.id, s); });
  albertoIndex = Array.from(byId.values());

  const exById = new Map();
  [...ex, ...impExercises].forEach(e=>{ if (e && e.id) exById.set(e.id, e); });
  albertoExercises = Array.from(exById.values());

  // base status
  try{
    const resp = await fetch("./treinos/state/training_status.json", { cache: "no-store" });
    const st = await resp.json();
    const saved = loadJson(STORAGE.ALB_STATUS, null);
    saveJson(STORAGE.ALB_STATUS, { ...st, ...(saved || {}) });
  }catch{}

  populateAlbertoSelect();
  syncAlbertoDefaults();
}

function populateAlbertoSelect(){
  els.albSessionSelect.innerHTML = "";
  const opt0 = document.createElement("option");
  opt0.value = "";
  opt0.textContent = "(Selecione)";
  els.albSessionSelect.appendChild(opt0);
  albertoIndex.forEach(s=>{
    const opt = document.createElement("option");
    opt.value = s.id;
    opt.textContent = s.name || s.id;
    els.albSessionSelect.appendChild(opt);
  });
}

function syncAlbertoDefaults(){
  const status = loadJson(STORAGE.ALB_STATUS, null);
  if (status){
    els.albCycle.value = els.albCycle.value || status.cycle || "Ciclo II";
    els.albPhase.value = els.albPhase.value || status.phase || "Fase 3";
    if (!els.albWeek.value || Number(els.albWeek.value) <= 0) els.albWeek.value = String(status.week || 11);
  }
  const s = getSettings();
  if (s.albSessionId) els.albSessionSelect.value = s.albSessionId;
  else if (albertoIndex[0]) els.albSessionSelect.value = albertoIndex[0].id;
  updateAlbertoPill();
}

function updateAlbertoPill(){
  const s = collectSettingsFromUI();
  const sess = albertoIndex.find(x=>x.id===s.albSessionId);
  els.albWeekPill.textContent = `${s.albCycle} • ${s.albPhase} • Semana ${s.albWeek}${sess ? ` • ${sess.name}` : ""}`;
}

async function getAlbertoSession(sessionId){
  if (!sessionId) return null;
  if (albertoSessions.has(sessionId)) return albertoSessions.get(sessionId);
  const meta = albertoIndex.find(x=>x.id===sessionId);
  if (!meta) return null;
  if (meta.path){
    const resp = await fetch(`./treinos/${meta.path}`, { cache: "no-store" });
    const s = await resp.json();
    albertoSessions.set(sessionId, s);
    return s;
  }
  if (meta.session){
    albertoSessions.set(sessionId, meta.session);
    return meta.session;
  }
  return null;
}

function normalizeName(s){
  return String(s||"")
    .toLowerCase()
    .normalize("NFD").replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function findAlbertoExerciseIdByName(name){
  const n = normalizeName(name);
  const hit = albertoExercises.find(e => normalizeName(e.name_pt || e.name || "") === n);
  return hit ? hit.id : null;
}

// ---------------- Sequence builders ----------------
function buildStretchSequence(){
  const s = collectSettingsFromUI();
  activeProgram = "stretch";
  activeSessionName = s.sessionName || (s.mode === "pre" ? "Alongamento Pré" : "Alongamento Pós");
  activeSessionId = "";
  sessionLogs = {};

  const phase = s.mode;
  const candidates = stretchItems.filter(it => stretchSelected.has(it.id) && (!it.phase || it.phase === phase || it.custom));
  if (!candidates.length){
    setStatus("Selecione itens no Banco", "warn");
    sequence = [];
    renderSequence();
    els.startBtn.disabled = true;
    els.saveSessionBtn.disabled = true;
    els.copyBtn.disabled = true;
    return;
  }

  const count = estimateCount(s.totalMinutes, s.stretchSeconds, s.restSeconds);
  const pick = shuffle(candidates).slice(0, count);

  const steps = [];
  let sideCursor = s.startSide;

  for (let i=0;i<pick.length;i++){
    const it = pick[i];
    const baseStep = { type:"step", program:"stretch", manual:false, duration:s.stretchSeconds, item:it, side:"NONE" };
    const sides = it.sides || "N";

    if (s.unilateralMode === "off" || sides !== "LR"){
      steps.push(baseStep);
    } else if (s.unilateralMode === "alternate"){
      steps.push({ ...baseStep, side: sideCursor });
      sideCursor = (sideCursor === "L") ? "R" : "L";
    } else {
      steps.push({ ...baseStep, side: "L" });
      steps.push({ ...baseStep, side: "R" });
    }

    if (s.restSeconds > 0 && i !== pick.length-1){
      steps.push({ type:"rest", program:"stretch", duration: s.restSeconds, restLabel:"Intervalo" });
    }
  }

  sequence = steps;
  currentIndex = 0;
  saveJson(STORAGE.LASTSEQ, { program: activeProgram, sessionName: activeSessionName, sessionId: activeSessionId, sequence });

  renderSequence();
  loadStep(0);
  setStatus("Sessão gerada", "good");
  els.startBtn.disabled = !sequence.length;
  els.saveSessionBtn.disabled = !sequence.length;
  els.copyBtn.disabled = !sequence.length;
}

function buildJudoSequence(){
  const s = collectSettingsFromUI();
  activeProgram = "judo";
  activeSessionName = s.sessionName || "Judô (Circuito)";
  activeSessionId = "";
  sessionLogs = {};

  const ids = Array.from(judoSelected);
  let stations = ids.map(id => judoStations.find(x=>x.id===id)).filter(Boolean);
  if (!stations.length){
    setStatus("Selecione estações do Judô", "warn");
    sequence = [];
    renderSequence();
    return;
  }
  if (s.judoShuffle) stations = shuffle(stations);

  const steps = [];
  for (let r=1;r<=s.judoRounds;r++){
    stations.forEach((st, idx) => {
      const key = `judo:${st.id}`;
      const yt = getOverrideId(key);
      steps.push({
        type:"step", program:"judo", manual:false, duration:s.judoWorkSec, stationId: st.id,
        item:{ id: st.id, name_pt: st.name, region:"Judô", level:`Round ${r}/${s.judoRounds}`,
          video:{ provider:"youtube", youtubeId: yt || null, searchQuery: st.name }
        },
        side:"NONE"
      });
      if (s.judoRestSec > 0 && idx !== stations.length-1){
        steps.push({ type:"rest", program:"judo", duration:s.judoRestSec, restLabel:"Descanso" });
      }
    });
    if (r !== s.judoRounds && s.judoRestRoundsSec > 0){
      steps.push({ type:"rest", program:"judo", duration:s.judoRestRoundsSec, restLabel:"Descanso entre rounds" });
    }
  }

  sequence = steps;
  currentIndex = 0;
  saveJson(STORAGE.LASTSEQ, { program: activeProgram, sessionName: activeSessionName, sessionId: activeSessionId, sequence });

  renderSequence();
  loadStep(0);
  setStatus("Circuito gerado", "good");
  els.startBtn.disabled = !sequence.length;
  els.saveSessionBtn.disabled = !sequence.length;
  els.copyBtn.disabled = !sequence.length;
}

async function buildAlbertoSequence(){
  const s = collectSettingsFromUI();
  activeProgram = "alberto";
  activeSessionName = s.sessionName || "Treino do Alberto";
  activeSessionId = s.albSessionId;
  sessionLogs = {};

  if (!activeSessionId){
    setStatus("Selecione um treino", "warn");
    sequence = [];
    renderSequence();
    return;
  }

  const session = await getAlbertoSession(activeSessionId);
  if (!session){
    setStatus("Não consegui carregar o treino", "bad");
    sequence = [];
    renderSequence();
    return;
  }

  saveJson(STORAGE.ALB_STATUS, { cycle: s.albCycle, phase: s.albPhase, week: s.albWeek, updatedAt: nowIso() });
  updateAlbertoPill();

  const steps = [];
  // warm-up manual
  steps.push({ type:"step", program:"alberto", manual:true, duration:0, side:"NONE", exerciseId:null,
    item:{ name_pt:"Warm-up (Mobility)", region:s.albCycle, level:s.albPhase, video:{ provider:"youtube", youtubeId:null, searchQuery:"mobility warm up" } }
  });

  const weekKey = `week_${s.albWeek}`;
  const prog = session.progression || {};
  const weekProg = prog[weekKey] || null;

  function resolveReps(ex){
    if (ex.kind === "reps_progression" && weekProg && ex.reps_key && weekProg[ex.reps_key]){
      const pr = weekProg[ex.reps_key];
      return { sets: pr.sets, reps: pr.reps };
    }
    if (ex.kind === "reps") return { reps: ex.reps };
    if (ex.kind === "reps_range") return { reps: `${ex.reps_min}-${ex.reps_max}` };
    if (ex.kind === "reps_total") return { reps: `${ex.reps_total} total` };
    if (ex.kind === "time") return { time: `${ex.time_sec}s` };
    return {};
  }

  function addExerciseStep(ex, contextLabel){
    const exId = findAlbertoExerciseIdByName(ex.name) || null;
    const key = exId ? `alberto:${exId}` : null;
    const yt = key ? getOverrideId(key) : null;

    const r = resolveReps(ex);
    const metaParts = [];
    if (r.sets && r.reps) metaParts.push(`${r.sets}x${r.reps}`);
    else if (r.reps) metaParts.push(`${r.reps}`);
    else if (r.time) metaParts.push(r.time);
    if (ex.load) metaParts.push(`Carga: ${ex.load}`);
    if (ex.equipment) metaParts.push(ex.equipment);

    const item = {
      id: exId || undefined,
      name_pt: ex.name,
      region: s.albCycle,
      level: `${s.albPhase}${contextLabel ? ` • ${contextLabel}` : ""}`,
      video: { provider:"youtube", youtubeId: yt || null, searchQuery: `${ex.name} exercício` }
    };

    if (ex.kind === "time" && ex.time_sec){
      steps.push({ type:"step", program:"alberto", manual:false, duration: ex.time_sec, item, exerciseId: exId, side:"NONE" });
    } else {
      steps.push({ type:"step", program:"alberto", manual:true, duration:0, item, exerciseId: exId, side:"NONE", hint: metaParts.join(" • ") });
    }
  }

  const blocks = Array.isArray(session.blocks) ? session.blocks : [];
  for (const block of blocks){
    if (block.type === "triset" || block.type === "biset"){
      const exs = Array.isArray(block.exercises) ? block.exercises : [];
      let rounds = block.rounds;
      if (!rounds){
        let inferred = 0;
        exs.forEach(ex => {
          const r = resolveReps(ex);
          if (r.sets) inferred = Math.max(inferred, r.sets);
        });
        rounds = inferred || 1;
      }

      for (let rr=1; rr<=rounds; rr++){
        exs.forEach((ex, idx) => {
          addExerciseStep(ex, `${block.name} • Série ${rr}/${rounds}`);
          if (block.rest_between_exercises_sec && idx !== exs.length-1){
            steps.push({ type:"rest", program:"alberto", duration:block.rest_between_exercises_sec, restLabel:"Troca" });
          }
        });
        if (block.rest_between_rounds_sec && rr !== rounds){
          steps.push({ type:"rest", program:"alberto", duration:block.rest_between_rounds_sec, restLabel:"Descanso" });
        }
      }
    }

    if (block.type === "amrap"){
      const list = Array.isArray(block.exercises) ? block.exercises : [];
      const desc = list.map(ex => {
        const r = resolveReps(ex);
        const reps = r.sets && r.reps ? `${r.sets}x${r.reps}` : (r.reps || "");
        return `${ex.name}${reps ? ` (${reps})` : ""}`;
      }).join(" • ");

      steps.push({
        type:"step", program:"alberto", manual:false, duration:block.duration_sec || 600, side:"NONE", exerciseId:null,
        item:{ name_pt:block.name || "AMRAP", region:s.albCycle, level:`${s.albPhase} • Semana ${s.albWeek}`,
          video:{ provider:"youtube", youtubeId:null, searchQuery:"amrap workout" }
        },
        hint: desc
      });

      if (block.rest_after_sec){
        steps.push({ type:"rest", program:"alberto", duration:block.rest_after_sec, restLabel:"Descanso" });
      }
    }
  }

  sequence = steps;
  currentIndex = 0;
  saveJson(STORAGE.LASTSEQ, { program: activeProgram, sessionName: activeSessionName, sessionId: activeSessionId, sequence });

  renderSequence();
  loadStep(0);
  setStatus("Treino gerado", "good");
  els.startBtn.disabled = !sequence.length;
  els.saveSessionBtn.disabled = !sequence.length;
  els.copyBtn.disabled = !sequence.length;
}

async function generateCurrent(){
  const s = collectSettingsFromUI();
  if (s.programType === "stretch") return buildStretchSequence();
  if (s.programType === "judo") return buildJudoSequence();
  return buildAlbertoSequence();
}

// ---------------- Sequence rendering ----------------
function badge(step){
  if (step.type === "rest") return { text: "Intervalo", cls: "neutral" };
  if (step.manual) return { text: "Manual", cls: "manual" };
  if (step.program === "judo") return { text: "Judô", cls: "good" };
  if (step.program === "alberto") return { text: "Alberto", cls: "good" };
  if (step.side === "L") return { text: "Esquerda", cls: "warn" };
  if (step.side === "R") return { text: "Direita", cls: "warn" };
  if (step.side === "BOTH") return { text: "Ambos", cls: "neutral" };
  return { text: "—", cls: "neutral" };
}

function stepTitle(step){
  if (step.type === "rest") return step.restLabel || "Intervalo";
  return (step.item && (step.item.name_pt || step.item.name_en)) || "Passo";
}

function renderSequence(){
  els.sequenceList.innerHTML = "";
  if (!sequence.length){
    els.sequenceMeta.textContent = "Nenhuma sessão gerada.";
    els.progressIndex.textContent = "0";
    els.progressTotal.textContent = "0";
    els.nextName.textContent = "—";
    els.barFill.style.width = "0%";
    els.stepCounter.textContent = "—";
    return;
  }

  const timed = sequence.reduce((sum, st)=> sum + (st.duration || 0), 0);
  const manualCount = sequence.filter(st => st.manual).length;
  els.sequenceMeta.textContent = `${sequence.length} passos • ${Math.round(timed/60)} min (timed)${manualCount ? ` • ${manualCount} manual` : ""}`;

  sequence.forEach((st, idx)=>{
    const li = document.createElement("li");
    const left = document.createElement("div");

    if (st.type === "rest"){
      left.innerHTML = `<div class="itemTitle">${idx+1}. ${escapeHtml(stepTitle(st))}</div><div class="itemMeta">${st.duration}s</div>`;
    } else {
      const meta = st.manual ? (st.hint ? st.hint : "Manual") : `${st.duration}s`;
      const sub = st.item && (st.item.region || st.item.level) ? `${escapeHtml(st.item.region || "")} • ${escapeHtml(st.item.level || "")}` : "";
      left.innerHTML = `<div class="itemTitle">${idx+1}. ${escapeHtml(stepTitle(st))}</div><div class="itemMeta">${sub}${sub ? " • " : ""}${escapeHtml(meta)}</div>`;
    }

    const b = badge(st);
    const right = document.createElement("div");
    right.className = `badge ${b.cls}`;
    right.textContent = b.text;

    li.appendChild(left);
    li.appendChild(right);
    els.sequenceList.appendChild(li);
  });

  els.copyBtn.disabled = false;
}

// ---------------- Player ----------------
function currentStep(){ return sequence[currentIndex] || null; }
function nextStepName(){ const n = sequence[currentIndex + 1]; return n ? stepTitle(n) : "—"; }

function getYoutubeIdForStep(step){
  if (!step || step.type === "rest") return null;
  if (step.program === "stretch"){
    const k = step.item && step.item.id;
    return (k && getOverrideId(k)) || (step.item && step.item.video && step.item.video.youtubeId) || null;
  }
  if (step.program === "judo"){
    const k = step.stationId ? `judo:${step.stationId}` : null;
    return (k && getOverrideId(k)) || (step.item && step.item.video && step.item.video.youtubeId) || null;
  }
  if (step.program === "alberto"){
    const k = step.exerciseId ? `alberto:${step.exerciseId}` : null;
    return (k && getOverrideId(k)) || (step.item && step.item.video && step.item.video.youtubeId) || null;
  }
  return (step.item && step.item.video && step.item.video.youtubeId) || null;
}

function loadStep(i){
  const st = sequence[i];
  if (!st) return;

  currentIndex = i;
  els.stepCounter.textContent = `${i+1}/${sequence.length}`;
  els.progressIndex.textContent = String(i+1);
  els.progressTotal.textContent = String(sequence.length);
  els.nextName.textContent = nextStepName();

  if (st.type === "rest"){
    els.chipPhase.textContent = "DESCANSO";
    els.nowTitle.textContent = "Respire";
    els.nowSub.textContent = st.restLabel || "Descanso";
    els.timerSub.textContent = "intervalo";
    els.albertoLogBox.classList.add("hidden");
  } else {
    const label = st.program === "stretch" ? "ALONGAMENTO" : (st.program === "judo" ? "JUDÔ" : "ALBERTO");
    els.chipPhase.textContent = label;
    els.nowTitle.textContent = stepTitle(st);

    if (st.manual){
      els.nowSub.textContent = st.hint || `${(st.item && st.item.region) || ""} ${(st.item && st.item.level) || ""}`.trim();
      els.timerSub.textContent = "manual";
    } else {
      const parts = [];
      if (st.item && st.item.region) parts.push(st.item.region);
      if (st.item && st.item.level) parts.push(st.item.level);
      els.nowSub.textContent = parts.join(" • ") || "—";
      els.timerSub.textContent = "restante";
    }

    if (st.program === "alberto" && st.exerciseId){
      els.albertoLogBox.classList.remove("hidden");
      populateAlbertoLogUI(st);
    } else {
      els.albertoLogBox.classList.add("hidden");
    }
  }

  if (st.manual){
    remaining = 0;
    stepTotal = 0;
    els.timerBig.textContent = "MANUAL";
  } else {
    remaining = st.duration;
    stepTotal = st.duration;
    els.timerBig.textContent = formatTime(remaining);
  }

  els.barFill.style.width = `${Math.round((currentIndex / Math.max(1, sequence.length)) * 100)}%`;
  els.countdownLabel.textContent = "";
  els.countdownText.textContent = "";
  els.sessionStatus.textContent = "";

  setYoutubeById(getYoutubeIdForStep(st));
}

// ---------------- Playback ----------------
function updateButtons(){
  els.startBtn.disabled = !sequence.length || isRunning;
  els.pauseBtn.disabled = !isRunning;
  els.prevBtn.disabled = !sequence.length;
  els.nextBtn.disabled = !sequence.length;
  els.stopBtn.disabled = !isRunning;
  els.pauseBtn.textContent = isPaused ? "Continuar" : "Pausar";
}

function start(){
  if (!sequence.length) return;
  ensureAudio();
  try{ refreshVoices(); }catch{}
  if (!isRunning){
    isRunning = true;
    isPaused = false;
    setStatus("Executando", "good");
    speakStep(currentStep());
    intervalId = setInterval(tick, 1000);
  }
  updateButtons();
}

function stop(){
  if (intervalId){ clearInterval(intervalId); intervalId = null; }
  isRunning = false; isPaused = false;
  updateButtons();
}

function togglePause(){
  if (!isRunning) return;
  isPaused = !isPaused;
  setStatus(isPaused ? "Pausado" : "Executando", isPaused ? "warn" : "good");
  updateButtons();
}

function tick(){
  if (!isRunning || isPaused) return;
  const st = currentStep();
  if (!st || st.manual) return;

  remaining -= 1;
  els.timerBig.textContent = formatTime(remaining);

  const done = stepTotal ? Math.min(1, (stepTotal - remaining) / stepTotal) : 1;
  const overall = (currentIndex + done) / Math.max(1, sequence.length);
  els.barFill.style.width = `${Math.round(overall * 100)}%`;

  if (remaining === 5){
    els.countdownLabel.textContent = "Trocando em";
    els.countdownText.textContent = "5";
    beep("count");
    speakCountdown(5);
  } else if (remaining < 5 && remaining >= 1){
    els.countdownLabel.textContent = "Trocando em";
    els.countdownText.textContent = String(remaining);
    beep("count");
    speakCountdown(remaining);
  } else {
    els.countdownLabel.textContent = "";
    els.countdownText.textContent = "";
  }

  if (remaining <= 0) advance(1, true);
}

function advance(delta, fromAuto=false){
  if (!sequence.length) return;
  let ni = currentIndex + delta;
  if (ni < 0) ni = 0;
  if (ni >= sequence.length){ finish(); return; }
  loadStep(ni);
  if (isRunning && (fromAuto || true)) speakStep(currentStep());
}

function finish(){
  stop();
  setStatus("Concluído", "good");
  const msg = activeProgram === "stretch" ? "Alongamento concluído" : (activeProgram === "judo" ? "Circuito concluído" : "Treino concluído");
  els.sessionStatus.textContent = `${msg} ✅`;
  els.countdownLabel.textContent = "";
  els.countdownText.textContent = "";
  beep("end");
  speakIfEnabled(msg);
  addHistoryEntry();
  updateButtons();
}

// ---------------- Alberto logs ----------------
function getAlbertoLogsStore(){ return loadJson(STORAGE.ALB_LOGS, {}); }
function saveAlbertoLog(exerciseId, entry){
  if (!exerciseId) return;
  const store = getAlbertoLogsStore();
  const list = Array.isArray(store[exerciseId]) ? store[exerciseId] : [];
  list.push(entry);
  store[exerciseId] = list;
  saveJson(STORAGE.ALB_LOGS, store);
}
function lastAlbertoLog(exerciseId){
  const store = getAlbertoLogsStore();
  const list = Array.isArray(store[exerciseId]) ? store[exerciseId] : [];
  return list.length ? list[list.length-1] : null;
}

function populateAlbertoLogUI(step){
  const exId = step.exerciseId;
  els.albLogMeta.textContent = exId ? `${exId}` : "—";
  const last = exId ? lastAlbertoLog(exId) : null;
  const key = exId ? `alberto:${exId}` : null;
  const yt = key ? getOverrideId(key) : null;
  els.albVideoLink.value = yt || (last?.youtubeId || "");
  els.albLoad.value = last?.load || "";
  els.albRepsDone.value = last?.reps || "";
  els.albNotes.value = "";
}

function handleSaveAlbertoLog(){
  const st = currentStep();
  if (!st || st.program !== "alberto" || !st.exerciseId) return;
  const exId = st.exerciseId;
  const youtubeId = parseYouTubeId(els.albVideoLink.value) || null;
  if (youtubeId){
    setVideoOverride(`alberto:${exId}`, youtubeId);
    setYoutubeById(youtubeId);
  }
  const entry = {
    at: nowIso(),
    sessionId: activeSessionId || null,
    sessionName: activeSessionName || null,
    cycle: (els.albCycle.value || "").trim(),
    phase: (els.albPhase.value || "").trim(),
    week: clampInt(els.albWeek.value, 1, 99, 11),
    youtubeId,
    load: (els.albLoad.value || "").trim(),
    reps: (els.albRepsDone.value || "").trim(),
    notes: (els.albNotes.value || "").trim()
  };
  saveAlbertoLog(exId, entry);
  sessionLogs[exId] = entry;
  setStatus("Registro salvo", "good");
}

function handleClearAlbertoLog(){
  els.albVideoLink.value = "";
  els.albLoad.value = "";
  els.albRepsDone.value = "";
  els.albNotes.value = "";
  setStatus("Campos limpos", "neutral");
}

// ---------------- History ----------------
function getHistory(){
  const h = loadJson(STORAGE.HISTORY, []);
  return Array.isArray(h) ? h : [];
}
function setHistory(hist){ saveJson(STORAGE.HISTORY, hist); }

function addHistoryEntry(){
  if (!sequence.length) return;
  const timedSeconds = sequence.reduce((sum, st)=> sum + (st.duration || 0), 0);
  const entry = {
    at: nowIso(),
    program: activeProgram,
    sessionName: activeSessionName || "",
    sessionId: activeSessionId || "",
    timedSeconds,
    steps: sequence.length,
    settings: getSettings(),
    logs: (activeProgram === "alberto") ? sessionLogs : null
  };
  const hist = getHistory();
  hist.unshift(entry);
  setHistory(hist.slice(0, 300));
  renderHistory();
}

function renderHistory(){
  const hist = getHistory();
  els.historyList.innerHTML = "";
  els.historyMeta.textContent = hist.length ? `${hist.length} sessões salvas` : "Nenhuma sessão ainda.";
  if (!hist.length){
    els.historyList.innerHTML = `<div class="mini">Quando terminar uma sessão, ela aparece aqui.</div>`;
    return;
  }
  hist.forEach(h=>{
    const div = document.createElement("div");
    div.className = "historyItem";
    const dt = new Date(h.at);
    const when = dt.toLocaleString("pt-BR");
    const mins = Math.round((h.timedSeconds||0)/60);
    const p = h.program === "stretch" ? "Alongamento" : h.program === "judo" ? "Judô" : "Alberto";

    let meta = `${h.steps} passos • ${mins} min (timed)`;
    if (h.program === "stretch") meta += ` • ${h.settings?.mode === "pre" ? "Pré" : "Pós"} • ${h.settings?.stretchSeconds}s + ${h.settings?.restSeconds}s`;
    if (h.program === "judo") meta += ` • ${h.settings?.judoWorkSec}s/${h.settings?.judoRestSec}s • ${h.settings?.judoRounds} rounds`;
    if (h.program === "alberto"){
      const logsN = h.logs ? Object.keys(h.logs).length : 0;
      meta += ` • Semana ${h.settings?.albWeek || "?"} • logs: ${logsN}`;
    }

    div.innerHTML = `
      <div class="title">${escapeHtml(when)} • ${escapeHtml(p)} • ${escapeHtml(h.sessionName || "(sem nome)")}</div>
      <div class="meta">${escapeHtml(meta)}</div>
    `;
    els.historyList.appendChild(div);
  });
}

function clearHistory(){
  setHistory([]);
  renderHistory();
  setStatus("Histórico limpo", "good");
}

// ---------------- Saved session ----------------
function saveSession(){
  if (!sequence.length){ setStatus("Gere uma sessão primeiro", "warn"); return; }
  saveJson(STORAGE.SAVED, { at: nowIso(), program: activeProgram, sessionName: activeSessionName, sessionId: activeSessionId, sequence });
  setStatus("Sessão salva", "good");
  renderSavedHint();
}

function loadSaved(){
  const d = loadJson(STORAGE.SAVED, null);
  if (!d || !Array.isArray(d.sequence) || !d.sequence.length){
    setStatus("Não há sessão salva", "warn");
    renderSavedHint();
    return;
  }
  sequence = d.sequence;
  activeProgram = d.program || "stretch";
  activeSessionName = d.sessionName || "";
  activeSessionId = d.sessionId || "";
  currentIndex = 0;
  saveJson(STORAGE.LASTSEQ, { program: activeProgram, sessionName: activeSessionName, sessionId: activeSessionId, sequence });
  renderSequence();
  loadStep(0);
  setStatus("Sessão carregada", "good");
  updateButtons();
}

function deleteSaved(){
  localStorage.removeItem(STORAGE.SAVED);
  renderSavedHint();
  setStatus("Sessão salva apagada", "good");
}

function renderSavedHint(){
  const d = loadJson(STORAGE.SAVED, null);
  if (!d || !Array.isArray(d.sequence) || !d.sequence.length){
    els.savedHint.textContent = "Nenhuma sessão salva.";
    return;
  }
  const dt = new Date(d.at);
  const when = dt.toLocaleString("pt-BR");
  const mins = Math.round(d.sequence.reduce((a,b)=>a+(b.duration||0),0)/60);
  els.savedHint.textContent = `Salva em ${escapeHtml(when)} • ~${mins} min • ${d.sequence.length} passos`;
}

// ---------------- Export / Import ----------------
function exportData(){
  const payload = {
    schema: "treinamento-barone.v6.2",
    exportedAt: nowIso(),
    settings: getSettings(),
    stretch: { custom: loadJson(STORAGE.STRETCH_CUSTOM, []), selected: loadJson(STORAGE.STRETCH_SELECTED, []) },
    judo: { stations: loadJson(STORAGE.JUDO_BANK, []), selected: loadJson(STORAGE.JUDO_SELECTED, []) },
    alberto: { imported: loadJson(STORAGE.ALB_IMPORTED, {sessions:[],exercises:[]}), status: loadJson(STORAGE.ALB_STATUS, null), logs: loadJson(STORAGE.ALB_LOGS, {}) },
    videoOverrides: loadJson(STORAGE.VIDEO_OVERRIDES, {}),
    history: getHistory(),
    savedSession: loadJson(STORAGE.SAVED, null)
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `treinamento-barone-dados-v6.2-${new Date().toISOString().slice(0,10)}.json`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(()=> URL.revokeObjectURL(a.href), 2000);
  setStatus("Exportado", "good");
}

async function importData(file){
  try{
    const text = await file.text();
    const j = JSON.parse(text);

    if (j && typeof j === "object" && String(j.schema||"").includes("treinamento-barone")){
      if (j.settings) saveJson(STORAGE.SETTINGS, { ...defaultSettings(), ...j.settings });
      if (j.stretch?.custom) saveJson(STORAGE.STRETCH_CUSTOM, j.stretch.custom);
      if (j.stretch?.selected) saveJson(STORAGE.STRETCH_SELECTED, j.stretch.selected);
      if (j.judo?.stations) saveJson(STORAGE.JUDO_BANK, j.judo.stations);
      if (j.judo?.selected) saveJson(STORAGE.JUDO_SELECTED, j.judo.selected);
      if (j.alberto?.imported) saveJson(STORAGE.ALB_IMPORTED, j.alberto.imported);
      if (j.alberto?.status) saveJson(STORAGE.ALB_STATUS, j.alberto.status);
      if (j.alberto?.logs) saveJson(STORAGE.ALB_LOGS, j.alberto.logs);
      if (j.videoOverrides) saveJson(STORAGE.VIDEO_OVERRIDES, j.videoOverrides);
      if (j.history) saveJson(STORAGE.HISTORY, j.history);
      if (j.savedSession) saveJson(STORAGE.SAVED, j.savedSession);
      await reloadAllData();
      setStatus("Importado", "good");
      return;
    }

    const imp = loadJson(STORAGE.ALB_IMPORTED, { sessions: [], exercises: [] });

    if (j && j.treinos && (j.treinos.sessions || j.treinos.index || j.treinos.exercises)){
      const newSessions = [];
      const newExercises = [];
      const idx = j.treinos.index;
      if (idx && Array.isArray(idx.alberto)) idx.alberto.forEach(m=>{ if (m && m.id) newSessions.push({ ...m, session: null }); });
      if (Array.isArray(j.treinos.exercises)) j.treinos.exercises.forEach(e=>{ if (e && e.id) newExercises.push(e); });
      if (Array.isArray(j.treinos.sessions)) j.treinos.sessions.forEach(s=>{ if (s && s.id) newSessions.push({ id: s.id, name: s.name || s.id, cycle: s.cycle || "", phase: s.phase || "", session: s }); });

      imp.sessions = mergeById([...imp.sessions, ...newSessions]);
      imp.exercises = mergeById([...imp.exercises, ...newExercises]);
      saveJson(STORAGE.ALB_IMPORTED, imp);
      await reloadAllData();
      setStatus("Treinos do Alberto importados", "good");
      return;
    }

    if (j && j.mode === "alberto" && j.id && j.blocks){
      imp.sessions = mergeById([...imp.sessions, { id: j.id, name: j.name || j.id, cycle: j.cycle || "", phase: j.phase || "", session: j }]);
      saveJson(STORAGE.ALB_IMPORTED, imp);
      await reloadAllData();
      setStatus("Treino do Alberto importado", "good");
      return;
    }

    setStatus("JSON não reconhecido", "warn");
  }catch{ setStatus("Falha ao importar", "bad"); }
}

function mergeById(arr){
  const m = new Map();
  arr.forEach(x=>{ if (x && x.id) m.set(x.id, x); });
  return Array.from(m.values());
}

// ---------------- Bank UI ----------------
function updateBankMeta(){
  if (els.bankType.value === "stretch"){
    els.bankMeta.textContent = `${stretchItems.length} itens • selecionados: ${stretchSelected.size}`;
  } else if (els.bankType.value === "judo"){
    els.bankMeta.textContent = `${judoStations.length} estações • marcadas no circuito: ${judoSelected.size}`;
  } else {
    els.bankMeta.textContent = `${albertoExercises.length} exercícios`;
  }
}

function renderBank(){
  const type = els.bankType.value;
  els.bankStretchWrap.classList.toggle("hidden", type !== "stretch");
  els.bankJudoWrap.classList.toggle("hidden", type !== "judo");
  els.bankAlbertoWrap.classList.toggle("hidden", type !== "alberto");
  if (type === "stretch") return renderStretchBank();
  if (type === "judo") return renderJudoBank();
  return renderAlbertoBank();
}

function stretchLabel(it){
  const phase = it.phase === "pre" ? "Pré" : (it.phase === "post" ? "Pós" : "—");
  const lvl = it.level || "—";
  const reg = it.region || "—";
  const sides = it.sides ? it.sides : "—";
  const yt = it.video && it.video.youtubeId ? "YT" : "—";
  return `${phase} • ${reg} • ${lvl} • sides:${sides} • vídeo:${yt}`;
}

function renderStretchBank(){
  const q = (els.bankSearch.value || "").trim().toLowerCase();
  const phase = els.bankPhaseFilter.value;
  const region = els.bankRegionFilter.value;
  const level = els.bankLevelFilter.value;

  const list = stretchItems.filter(it=>{
    const name = (it.name_pt || it.name_en || "").toLowerCase();
    const tags = Array.isArray(it.tags) ? it.tags.join(" ").toLowerCase() : "";
    const matchesQ = !q || name.includes(q) || tags.includes(q) || String(it.region||"").toLowerCase().includes(q);

    const matchesPhase = phase === "all" ? true : (phase === "custom" ? !!it.custom : (it.phase === phase));
    const matchesRegion = region === "all" ? true : (it.region === region);
    const matchesLevel = level === "all" ? true : (it.level === level);
    return matchesQ && matchesPhase && matchesRegion && matchesLevel;
  });

  els.bankList.innerHTML = "";
  list.forEach(it=>{
    const row = document.createElement("div");
    row.className = "exerciseRow";

    const chk = document.createElement("input");
    chk.type = "checkbox";
    chk.checked = stretchSelected.has(it.id);
    chk.addEventListener("change", ()=>{
      if (chk.checked) stretchSelected.add(it.id); else stretchSelected.delete(it.id);
      saveJson(STORAGE.STRETCH_SELECTED, Array.from(stretchSelected));
      updateBankMeta();
      updateSummary();
    });

    const colName = document.createElement("div");
    colName.innerHTML = `<div class="name">${escapeHtml(it.name_pt || it.name_en || it.id)}</div><div class="metaSmall">${escapeHtml(stretchLabel(it))}</div>`;

    const actions = document.createElement("div");
    actions.className = "actions";

    const btnCopy = document.createElement("button");
    btnCopy.className = "smallBtn";
    btnCopy.textContent = "Copiar nome";
    btnCopy.addEventListener("click", async ()=>{
      try{ await navigator.clipboard.writeText(it.name_pt || it.name_en || it.id); setStatus("Copiado", "good"); }
      catch{ setStatus("Não foi possível copiar", "warn"); }
    });

    const btnVideo = document.createElement("button");
    btnVideo.className = "smallBtn";
    btnVideo.textContent = "Colar YT";
    btnVideo.addEventListener("click", async ()=>{
      const txt = prompt("Cole o link ou ID do YouTube para este alongamento (vazio para remover):", (it.video && it.video.youtubeId) ? it.video.youtubeId : "");
      if (txt === null) return;
      const id = parseYouTubeId(txt);
      const o = getVideoOverrides();
      o[it.id] = { youtubeId: id || null, updatedAt: nowIso() };
      saveJson(STORAGE.VIDEO_OVERRIDES, o);
      await reloadAllData();
      setStatus("Atualizado", "good");
    });

    actions.appendChild(btnCopy);
    actions.appendChild(btnVideo);

    row.appendChild(chk);
    row.appendChild(colName);
    row.appendChild(actions);
    els.bankList.appendChild(row);
  });

  updateBankMeta();
}

function addStretchCustom(){
  const name_pt = (els.newNamePt.value || "").trim();
  if (!name_pt){ setStatus("Informe um nome", "warn"); return; }
  const phase = els.newPhase.value;
  const region = (els.newRegion.value || "").trim() || "custom";
  const sides = els.newSides.value;
  const youtubeId = parseYouTubeId(els.newYoutubeId.value);
  const searchQuery = (els.newSearchQuery.value || "").trim() || name_pt;

  const id = `CUST-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,6)}`;
  const item = {
    id,
    name_pt,
    name_en: name_pt,
    phase,
    region,
    level: "custom",
    sides: sides === "N" ? "N" : sides,
    tags: [region, phase, "custom"],
    custom: true,
    video: { provider:"youtube", youtubeId: youtubeId || null, searchQuery }
  };

  const custom = loadJson(STORAGE.STRETCH_CUSTOM, []);
  const list = Array.isArray(custom) ? custom : [];
  list.push(item);
  saveJson(STORAGE.STRETCH_CUSTOM, list);

  stretchSelected.add(id);
  saveJson(STORAGE.STRETCH_SELECTED, Array.from(stretchSelected));

  els.newNamePt.value = "";
  els.newRegion.value = "";
  els.newYoutubeId.value = "";
  els.newSearchQuery.value = "";

  reloadAllData();
  setStatus("Adicionado", "good");
}

function deleteSelectedCustom(){
  const custom = loadJson(STORAGE.STRETCH_CUSTOM, []);
  const list = Array.isArray(custom) ? custom : [];
  const toDelete = new Set([...stretchSelected].filter(id => String(id).startsWith("CUST-")));
  if (!toDelete.size){ setStatus("Nenhum personalizado selecionado", "warn"); return; }
  const kept = list.filter(it => !toDelete.has(it.id));
  saveJson(STORAGE.STRETCH_CUSTOM, kept);
  toDelete.forEach(id=> stretchSelected.delete(id));
  saveJson(STORAGE.STRETCH_SELECTED, Array.from(stretchSelected));
  reloadAllData();
  setStatus("Personalizados apagados", "good");
}

function resetStretchCustom(){
  if (!confirm("Apagar todos personalizados?")) return;
  saveJson(STORAGE.STRETCH_CUSTOM, []);
  reloadAllData();
  setStatus("Personalizados removidos", "good");
}

function renderJudoBank(){
  const q = (els.bankSearch.value || "").trim().toLowerCase();
  const list = judoStations.filter(st => !q || String(st.name||"").toLowerCase().includes(q) || String(st.id||"").toLowerCase().includes(q));

  els.judoBankList.innerHTML = "";
  list.forEach(st=>{
    const row = document.createElement("div");
    row.className = "exerciseRow";

    const col = document.createElement("div");
    col.innerHTML = `<div class="name">${escapeHtml(st.name)} <span class="mini">(${escapeHtml(st.id)})</span></div><div class="metaSmall">Vídeo do YouTube (opcional)</div>`;

    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = "Cole link/ID do YouTube";
    input.value = getOverrideId(`judo:${st.id}`) || "";
    input.addEventListener("change", ()=>{
      const id = parseYouTubeId(input.value);
      setVideoOverride(`judo:${st.id}`, id);
      input.value = id || "";
      setStatus("Vídeo atualizado", "good");
      renderJudoChecklist();
    });

    const actions = document.createElement("div");
    actions.className = "actions";

    const btnDel = document.createElement("button");
    btnDel.className = "smallBtn danger";
    btnDel.textContent = "Excluir";
    btnDel.addEventListener("click", ()=>{
      if (!confirm(`Excluir estação '${st.name}'?`)) return;
      judoStations = judoStations.filter(x=>x.id!==st.id);
      judoSelected.delete(st.id);
      saveJudoBank();
      saveJson(STORAGE.JUDO_SELECTED, Array.from(judoSelected));
      renderJudoBank();
      renderJudoChecklist();
      updateSummary();
      updateBankMeta();
      setStatus("Excluída", "good");
    });

    actions.appendChild(btnDel);

    row.appendChild(col);
    row.appendChild(input);
    row.appendChild(actions);
    els.judoBankList.appendChild(row);
  });

  updateBankMeta();
}

function addJudoStation(name){
  const n = (name || "").trim();
  if (!n) return;
  const id = `JUD-${String(judoStations.length+1).padStart(4,"0")}`;
  judoStations.push({ id, name: n });
  saveJudoBank();
  judoSelected.add(id);
  saveJson(STORAGE.JUDO_SELECTED, Array.from(judoSelected));
  renderJudoBank();
  renderJudoChecklist();
  updateSummary();
  setStatus("Estação adicionada", "good");
}

function renderAlbertoBank(){
  const q = (els.bankSearch.value || "").trim().toLowerCase();
  const list = albertoExercises.filter(ex => {
    const n = String(ex.name_pt || ex.name || "").toLowerCase();
    return !q || n.includes(q) || String(ex.id||"").toLowerCase().includes(q);
  });

  els.albertoBankList.innerHTML = "";
  list.forEach(ex=>{
    const row = document.createElement("div");
    row.className = "exerciseRow";

    const col = document.createElement("div");
    col.innerHTML = `<div class="name">${escapeHtml(ex.name_pt || ex.name || ex.id)} <span class="mini">(${escapeHtml(ex.id)})</span></div><div class="metaSmall">Vídeo YouTube + última carga (se houver)</div>`;

    const last = lastAlbertoLog(ex.id);
    const lastTxt = last && (last.load || last.reps) ? `${last.load || ""}${last.reps ? ` • ${last.reps}` : ""}` : "—";

    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = "Cole link/ID do YouTube";
    input.value = getOverrideId(`alberto:${ex.id}`) || "";
    input.addEventListener("change", ()=>{
      const id = parseYouTubeId(input.value);
      setVideoOverride(`alberto:${ex.id}`, id);
      input.value = id || "";
      setStatus("Vídeo atualizado", "good");
    });

    const meta = document.createElement("div");
    meta.className = "muted";
    meta.textContent = `Último: ${lastTxt}`;

    row.appendChild(col);
    row.appendChild(input);
    row.appendChild(meta);
    els.albertoBankList.appendChild(row);
  });

  updateBankMeta();
}

// ---------------- Judô checklist (Sessão) ----------------
function renderJudoChecklist(){
  els.judoChecklist.innerHTML = "";
  judoStations.forEach(st=>{
    const row = document.createElement("div");
    row.className = "exerciseRow";

    const chk = document.createElement("input");
    chk.type = "checkbox";
    chk.checked = judoSelected.has(st.id);
    chk.addEventListener("change", ()=>{
      if (chk.checked) judoSelected.add(st.id); else judoSelected.delete(st.id);
      saveJson(STORAGE.JUDO_SELECTED, Array.from(judoSelected));
      updateSummary();
    });

    const col = document.createElement("div");
    const yt = getOverrideId(`judo:${st.id}`) ? "YT ✅" : "YT —";
    col.innerHTML = `<div class="name">${escapeHtml(st.name)}</div><div class="metaSmall">${escapeHtml(st.id)} • ${yt}</div>`;

    row.appendChild(chk);
    row.appendChild(col);
    els.judoChecklist.appendChild(row);
  });
}

// ---------------- UI: Program & Bank switches ----------------
function handleProgramChange(){
  const s = collectSettingsFromUI();
  setProgramUI(s.programType);
  if (s.programType === "stretch") els.bankType.value = "stretch";
  if (s.programType === "judo") els.bankType.value = "judo";
  if (s.programType === "alberto") els.bankType.value = "alberto";
  renderBank();
}

// ---------------- PWA ----------------
function registerServiceWorker(){
  if (!("serviceWorker" in navigator)) return;
  window.addEventListener("load", ()=>{ navigator.serviceWorker.register("./sw.js").catch(()=>{}); });
}

function setupInstall(){
  window.addEventListener("beforeinstallprompt", (event)=>{
    event.preventDefault();
    deferredInstallPrompt = event;
    els.installBtn.style.display = "inline-flex";
  });

  els.installBtn.addEventListener("click", async ()=>{
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    try{ await deferredInstallPrompt.userChoice; }catch{}
    deferredInstallPrompt = null;
  });
}

// ---------------- Misc ----------------
async function copySessionToClipboard(){
  if (!sequence.length){ setStatus("Nada para copiar", "warn"); return; }
  const lines = sequence.map((st, idx)=>{
    if (st.type === "rest") return `${idx+1}. ${st.restLabel || "Intervalo"} — ${st.duration}s`;
    return `${idx+1}. ${stepTitle(st)} — ${st.manual ? "manual" : `${st.duration}s`}`;
  });
  const header = `Treinamento - Barone • ${String(activeProgram).toUpperCase()} • ${activeSessionName}`;
  const text = [header, "", ...lines].join("\n");
  try{ await navigator.clipboard.writeText(text); setStatus("Sessão copiada", "good"); }
  catch{ setStatus("Falha ao copiar", "warn"); }
}

async function reloadAllData(){
  await loadStretchBank();
  await loadJudoBank();
  await loadAlbertoPack();
  renderJudoChecklist();
  renderBank();
  renderHistory();
  renderSavedHint();
  updateSummary();
}

// ---------------- Alberto import/reset (Sessão) ----------------
async function importAlbertoFile(file){
  if (!file) return;
  await importData(file);
}

function resetAlbertoImports(){
  if (!confirm("Limpar treinos importados do Alberto?")) return;
  saveJson(STORAGE.ALB_IMPORTED, { sessions: [], exercises: [] });
  albertoSessions.clear();
  reloadAllData();
  setStatus("Treinos importados removidos", "good");
}

// ---------------- Wire ----------------
function wire(){
  els.tabs.forEach(btn=> btn.addEventListener("click", ()=> setActiveTab(btn.dataset.tab)));

  els.programType.addEventListener("change", handleProgramChange);
  els.sessionName.addEventListener("input", ()=>{ collectSettingsFromUI(); updateSummary(); });

  [els.mode, els.totalMinutes, els.stretchSeconds, els.restSeconds, els.startSide, els.unilateralMode]
    .forEach(el=> el.addEventListener("change", ()=>{ collectSettingsFromUI(); updateSummary(); }));

  [els.judoWorkSec, els.judoRestSec, els.judoRounds, els.judoRestRoundsSec]
    .forEach(el=> el.addEventListener("change", ()=>{ collectSettingsFromUI(); updateSummary(); }));
  els.judoShuffle.addEventListener("change", ()=>{ collectSettingsFromUI(); updateSummary(); });

  els.judoQuickAddBtn.addEventListener("click", ()=>{ addJudoStation(els.judoQuickName.value); els.judoQuickName.value = ""; });
  els.judoSelectAllBtn.addEventListener("click", ()=>{
    judoSelected = new Set(judoStations.map(s=>s.id));
    saveJson(STORAGE.JUDO_SELECTED, Array.from(judoSelected));
    renderJudoChecklist();
    updateSummary();
    setStatus("Selecionou todas", "good");
  });
  els.judoSelectNoneBtn.addEventListener("click", ()=>{
    judoSelected.clear();
    saveJson(STORAGE.JUDO_SELECTED, Array.from(judoSelected));
    renderJudoChecklist();
    updateSummary();
    setStatus("Desmarcou todas", "good");
  });

  [els.albCycle, els.albPhase, els.albWeek]
    .forEach(el=> el.addEventListener("change", ()=>{ collectSettingsFromUI(); updateAlbertoPill(); updateSummary(); }));
  els.albSessionSelect.addEventListener("change", ()=>{ collectSettingsFromUI(); updateAlbertoPill(); updateSummary(); });

  els.albImportFile.addEventListener("change", ()=>{
    const f = els.albImportFile.files && els.albImportFile.files[0];
    if (f) importAlbertoFile(f);
    els.albImportFile.value = "";
  });
  els.albResetPackBtn.addEventListener("click", resetAlbertoImports);

  [els.beepEnabled, els.speakEndEnabled, els.speakCountdownEnabled, els.announceStepEnabled, els.voicePref, els.voiceSelect]
    .forEach(el=> el.addEventListener("change", ()=> collectSettingsFromUI()));

  els.generateBtn.addEventListener("click", ()=>{ generateCurrent(); });
  els.startBtn.addEventListener("click", start);
  els.pauseBtn.addEventListener("click", togglePause);
  els.prevBtn.addEventListener("click", ()=> advance(-1, false));
  els.nextBtn.addEventListener("click", ()=> advance(1, false));
  els.stopBtn.addEventListener("click", ()=>{ stop(); setStatus("Encerrado", "warn"); });
  els.copyBtn.addEventListener("click", copySessionToClipboard);
  els.saveSessionBtn.addEventListener("click", saveSession);

  els.btnOpenSearch.addEventListener("click", openSearch);

  els.albSaveLogBtn.addEventListener("click", handleSaveAlbertoLog);
  els.albClearLogBtn.addEventListener("click", handleClearAlbertoLog);

  els.bankType.addEventListener("change", ()=>{ renderBank(); });
  els.bankSearch.addEventListener("input", renderBank);

  [els.bankPhaseFilter, els.bankRegionFilter, els.bankLevelFilter]
    .forEach(el=> el.addEventListener("change", renderStretchBank));

  els.selectAllBtn.addEventListener("click", ()=>{
    stretchItems.forEach(it=> stretchSelected.add(it.id));
    saveJson(STORAGE.STRETCH_SELECTED, Array.from(stretchSelected));
    renderStretchBank();
    updateSummary();
    setStatus("Selecionou tudo", "good");
  });
  els.selectNoneBtn.addEventListener("click", ()=>{
    stretchSelected.clear();
    saveJson(STORAGE.STRETCH_SELECTED, Array.from(stretchSelected));
    renderStretchBank();
    updateSummary();
    setStatus("Desmarcou tudo", "good");
  });
  els.deleteCustomBtn.addEventListener("click", deleteSelectedCustom);

  els.addCustomBtn.addEventListener("click", addStretchCustom);
  els.resetCustomBtn.addEventListener("click", resetStretchCustom);

  els.judoAddStationBtn.addEventListener("click", ()=>{ addJudoStation(els.judoNewStation.value); els.judoNewStation.value = ""; });

  els.exportBtn.addEventListener("click", exportData);
  els.importFile.addEventListener("change", ()=>{
    const f = els.importFile.files && els.importFile.files[0];
    if (f) importData(f);
    els.importFile.value = "";
  });
  els.clearHistoryBtn.addEventListener("click", clearHistory);
  els.loadSavedBtn.addEventListener("click", loadSaved);
  els.deleteSavedBtn.addEventListener("click", deleteSaved);
}

// ---------------- Boot ----------------
async function init(){
  migrateV61();
  registerServiceWorker();
  setupInstall();

  if ("speechSynthesis" in window){
    refreshVoices();
    window.speechSynthesis.onvoiceschanged = refreshVoices;
  }

  await reloadAllData();
  applySettingsToUI();

  const last = loadJson(STORAGE.LASTSEQ, null);
  if (last && Array.isArray(last.sequence) && last.sequence.length){
    sequence = last.sequence;
    activeProgram = last.program || "stretch";
    activeSessionName = last.sessionName || "";
    activeSessionId = last.sessionId || "";
    renderSequence();
    loadStep(0);
    els.startBtn.disabled = false;
    els.saveSessionBtn.disabled = false;
    els.copyBtn.disabled = false;
  } else {
    await generateCurrent();
  }

  wire();
  updateButtons();
  setStatus("Pronto", "neutral");
}

init();
