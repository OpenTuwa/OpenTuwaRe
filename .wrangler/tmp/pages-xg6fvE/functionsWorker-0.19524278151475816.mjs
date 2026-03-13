var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// ../node_modules/unenv/dist/runtime/_internal/utils.mjs
// @__NO_SIDE_EFFECTS__
function createNotImplementedError(name) {
  return new Error(`[unenv] ${name} is not implemented yet!`);
}
__name(createNotImplementedError, "createNotImplementedError");
// @__NO_SIDE_EFFECTS__
function notImplemented(name) {
  const fn = /* @__PURE__ */ __name(() => {
    throw /* @__PURE__ */ createNotImplementedError(name);
  }, "fn");
  return Object.assign(fn, { __unenv__: true });
}
__name(notImplemented, "notImplemented");
// @__NO_SIDE_EFFECTS__
function notImplementedClass(name) {
  return class {
    __unenv__ = true;
    constructor() {
      throw new Error(`[unenv] ${name} is not implemented yet!`);
    }
  };
}
__name(notImplementedClass, "notImplementedClass");

// ../node_modules/unenv/dist/runtime/node/internal/perf_hooks/performance.mjs
var _timeOrigin = globalThis.performance?.timeOrigin ?? Date.now();
var _performanceNow = globalThis.performance?.now ? globalThis.performance.now.bind(globalThis.performance) : () => Date.now() - _timeOrigin;
var nodeTiming = {
  name: "node",
  entryType: "node",
  startTime: 0,
  duration: 0,
  nodeStart: 0,
  v8Start: 0,
  bootstrapComplete: 0,
  environment: 0,
  loopStart: 0,
  loopExit: 0,
  idleTime: 0,
  uvMetricsInfo: {
    loopCount: 0,
    events: 0,
    eventsWaiting: 0
  },
  detail: void 0,
  toJSON() {
    return this;
  }
};
var PerformanceEntry = class {
  static {
    __name(this, "PerformanceEntry");
  }
  __unenv__ = true;
  detail;
  entryType = "event";
  name;
  startTime;
  constructor(name, options) {
    this.name = name;
    this.startTime = options?.startTime || _performanceNow();
    this.detail = options?.detail;
  }
  get duration() {
    return _performanceNow() - this.startTime;
  }
  toJSON() {
    return {
      name: this.name,
      entryType: this.entryType,
      startTime: this.startTime,
      duration: this.duration,
      detail: this.detail
    };
  }
};
var PerformanceMark = class PerformanceMark2 extends PerformanceEntry {
  static {
    __name(this, "PerformanceMark");
  }
  entryType = "mark";
  constructor() {
    super(...arguments);
  }
  get duration() {
    return 0;
  }
};
var PerformanceMeasure = class extends PerformanceEntry {
  static {
    __name(this, "PerformanceMeasure");
  }
  entryType = "measure";
};
var PerformanceResourceTiming = class extends PerformanceEntry {
  static {
    __name(this, "PerformanceResourceTiming");
  }
  entryType = "resource";
  serverTiming = [];
  connectEnd = 0;
  connectStart = 0;
  decodedBodySize = 0;
  domainLookupEnd = 0;
  domainLookupStart = 0;
  encodedBodySize = 0;
  fetchStart = 0;
  initiatorType = "";
  name = "";
  nextHopProtocol = "";
  redirectEnd = 0;
  redirectStart = 0;
  requestStart = 0;
  responseEnd = 0;
  responseStart = 0;
  secureConnectionStart = 0;
  startTime = 0;
  transferSize = 0;
  workerStart = 0;
  responseStatus = 0;
};
var PerformanceObserverEntryList = class {
  static {
    __name(this, "PerformanceObserverEntryList");
  }
  __unenv__ = true;
  getEntries() {
    return [];
  }
  getEntriesByName(_name, _type) {
    return [];
  }
  getEntriesByType(type) {
    return [];
  }
};
var Performance = class {
  static {
    __name(this, "Performance");
  }
  __unenv__ = true;
  timeOrigin = _timeOrigin;
  eventCounts = /* @__PURE__ */ new Map();
  _entries = [];
  _resourceTimingBufferSize = 0;
  navigation = void 0;
  timing = void 0;
  timerify(_fn, _options) {
    throw createNotImplementedError("Performance.timerify");
  }
  get nodeTiming() {
    return nodeTiming;
  }
  eventLoopUtilization() {
    return {};
  }
  markResourceTiming() {
    return new PerformanceResourceTiming("");
  }
  onresourcetimingbufferfull = null;
  now() {
    if (this.timeOrigin === _timeOrigin) {
      return _performanceNow();
    }
    return Date.now() - this.timeOrigin;
  }
  clearMarks(markName) {
    this._entries = markName ? this._entries.filter((e) => e.name !== markName) : this._entries.filter((e) => e.entryType !== "mark");
  }
  clearMeasures(measureName) {
    this._entries = measureName ? this._entries.filter((e) => e.name !== measureName) : this._entries.filter((e) => e.entryType !== "measure");
  }
  clearResourceTimings() {
    this._entries = this._entries.filter((e) => e.entryType !== "resource" || e.entryType !== "navigation");
  }
  getEntries() {
    return this._entries;
  }
  getEntriesByName(name, type) {
    return this._entries.filter((e) => e.name === name && (!type || e.entryType === type));
  }
  getEntriesByType(type) {
    return this._entries.filter((e) => e.entryType === type);
  }
  mark(name, options) {
    const entry = new PerformanceMark(name, options);
    this._entries.push(entry);
    return entry;
  }
  measure(measureName, startOrMeasureOptions, endMark) {
    let start;
    let end;
    if (typeof startOrMeasureOptions === "string") {
      start = this.getEntriesByName(startOrMeasureOptions, "mark")[0]?.startTime;
      end = this.getEntriesByName(endMark, "mark")[0]?.startTime;
    } else {
      start = Number.parseFloat(startOrMeasureOptions?.start) || this.now();
      end = Number.parseFloat(startOrMeasureOptions?.end) || this.now();
    }
    const entry = new PerformanceMeasure(measureName, {
      startTime: start,
      detail: {
        start,
        end
      }
    });
    this._entries.push(entry);
    return entry;
  }
  setResourceTimingBufferSize(maxSize) {
    this._resourceTimingBufferSize = maxSize;
  }
  addEventListener(type, listener, options) {
    throw createNotImplementedError("Performance.addEventListener");
  }
  removeEventListener(type, listener, options) {
    throw createNotImplementedError("Performance.removeEventListener");
  }
  dispatchEvent(event) {
    throw createNotImplementedError("Performance.dispatchEvent");
  }
  toJSON() {
    return this;
  }
};
var PerformanceObserver = class {
  static {
    __name(this, "PerformanceObserver");
  }
  __unenv__ = true;
  static supportedEntryTypes = [];
  _callback = null;
  constructor(callback) {
    this._callback = callback;
  }
  takeRecords() {
    return [];
  }
  disconnect() {
    throw createNotImplementedError("PerformanceObserver.disconnect");
  }
  observe(options) {
    throw createNotImplementedError("PerformanceObserver.observe");
  }
  bind(fn) {
    return fn;
  }
  runInAsyncScope(fn, thisArg, ...args) {
    return fn.call(thisArg, ...args);
  }
  asyncId() {
    return 0;
  }
  triggerAsyncId() {
    return 0;
  }
  emitDestroy() {
    return this;
  }
};
var performance = globalThis.performance && "addEventListener" in globalThis.performance ? globalThis.performance : new Performance();

// ../node_modules/wrangler/node_modules/@cloudflare/unenv-preset/dist/runtime/polyfill/performance.mjs
globalThis.performance = performance;
globalThis.Performance = Performance;
globalThis.PerformanceEntry = PerformanceEntry;
globalThis.PerformanceMark = PerformanceMark;
globalThis.PerformanceMeasure = PerformanceMeasure;
globalThis.PerformanceObserver = PerformanceObserver;
globalThis.PerformanceObserverEntryList = PerformanceObserverEntryList;
globalThis.PerformanceResourceTiming = PerformanceResourceTiming;

// ../node_modules/unenv/dist/runtime/node/console.mjs
import { Writable } from "node:stream";

// ../node_modules/unenv/dist/runtime/mock/noop.mjs
var noop_default = Object.assign(() => {
}, { __unenv__: true });

// ../node_modules/unenv/dist/runtime/node/console.mjs
var _console = globalThis.console;
var _ignoreErrors = true;
var _stderr = new Writable();
var _stdout = new Writable();
var log = _console?.log ?? noop_default;
var info = _console?.info ?? log;
var trace = _console?.trace ?? info;
var debug = _console?.debug ?? log;
var table = _console?.table ?? log;
var error = _console?.error ?? log;
var warn = _console?.warn ?? error;
var createTask = _console?.createTask ?? /* @__PURE__ */ notImplemented("console.createTask");
var clear = _console?.clear ?? noop_default;
var count = _console?.count ?? noop_default;
var countReset = _console?.countReset ?? noop_default;
var dir = _console?.dir ?? noop_default;
var dirxml = _console?.dirxml ?? noop_default;
var group = _console?.group ?? noop_default;
var groupEnd = _console?.groupEnd ?? noop_default;
var groupCollapsed = _console?.groupCollapsed ?? noop_default;
var profile = _console?.profile ?? noop_default;
var profileEnd = _console?.profileEnd ?? noop_default;
var time = _console?.time ?? noop_default;
var timeEnd = _console?.timeEnd ?? noop_default;
var timeLog = _console?.timeLog ?? noop_default;
var timeStamp = _console?.timeStamp ?? noop_default;
var Console = _console?.Console ?? /* @__PURE__ */ notImplementedClass("console.Console");
var _times = /* @__PURE__ */ new Map();
var _stdoutErrorHandler = noop_default;
var _stderrErrorHandler = noop_default;

// ../node_modules/wrangler/node_modules/@cloudflare/unenv-preset/dist/runtime/node/console.mjs
var workerdConsole = globalThis["console"];
var {
  assert,
  clear: clear2,
  // @ts-expect-error undocumented public API
  context,
  count: count2,
  countReset: countReset2,
  // @ts-expect-error undocumented public API
  createTask: createTask2,
  debug: debug2,
  dir: dir2,
  dirxml: dirxml2,
  error: error2,
  group: group2,
  groupCollapsed: groupCollapsed2,
  groupEnd: groupEnd2,
  info: info2,
  log: log2,
  profile: profile2,
  profileEnd: profileEnd2,
  table: table2,
  time: time2,
  timeEnd: timeEnd2,
  timeLog: timeLog2,
  timeStamp: timeStamp2,
  trace: trace2,
  warn: warn2
} = workerdConsole;
Object.assign(workerdConsole, {
  Console,
  _ignoreErrors,
  _stderr,
  _stderrErrorHandler,
  _stdout,
  _stdoutErrorHandler,
  _times
});
var console_default = workerdConsole;

// ../node_modules/wrangler/_virtual_unenv_global_polyfill-@cloudflare-unenv-preset-node-console
globalThis.console = console_default;

// ../node_modules/unenv/dist/runtime/node/internal/process/hrtime.mjs
var hrtime = /* @__PURE__ */ Object.assign(/* @__PURE__ */ __name(function hrtime2(startTime) {
  const now = Date.now();
  const seconds = Math.trunc(now / 1e3);
  const nanos = now % 1e3 * 1e6;
  if (startTime) {
    let diffSeconds = seconds - startTime[0];
    let diffNanos = nanos - startTime[0];
    if (diffNanos < 0) {
      diffSeconds = diffSeconds - 1;
      diffNanos = 1e9 + diffNanos;
    }
    return [diffSeconds, diffNanos];
  }
  return [seconds, nanos];
}, "hrtime"), { bigint: /* @__PURE__ */ __name(function bigint() {
  return BigInt(Date.now() * 1e6);
}, "bigint") });

// ../node_modules/unenv/dist/runtime/node/internal/process/process.mjs
import { EventEmitter } from "node:events";

// ../node_modules/unenv/dist/runtime/node/internal/tty/read-stream.mjs
var ReadStream = class {
  static {
    __name(this, "ReadStream");
  }
  fd;
  isRaw = false;
  isTTY = false;
  constructor(fd) {
    this.fd = fd;
  }
  setRawMode(mode) {
    this.isRaw = mode;
    return this;
  }
};

// ../node_modules/unenv/dist/runtime/node/internal/tty/write-stream.mjs
var WriteStream = class {
  static {
    __name(this, "WriteStream");
  }
  fd;
  columns = 80;
  rows = 24;
  isTTY = false;
  constructor(fd) {
    this.fd = fd;
  }
  clearLine(dir3, callback) {
    callback && callback();
    return false;
  }
  clearScreenDown(callback) {
    callback && callback();
    return false;
  }
  cursorTo(x, y, callback) {
    callback && typeof callback === "function" && callback();
    return false;
  }
  moveCursor(dx, dy, callback) {
    callback && callback();
    return false;
  }
  getColorDepth(env2) {
    return 1;
  }
  hasColors(count3, env2) {
    return false;
  }
  getWindowSize() {
    return [this.columns, this.rows];
  }
  write(str, encoding, cb) {
    if (str instanceof Uint8Array) {
      str = new TextDecoder().decode(str);
    }
    try {
      console.log(str);
    } catch {
    }
    cb && typeof cb === "function" && cb();
    return false;
  }
};

// ../node_modules/unenv/dist/runtime/node/internal/process/node-version.mjs
var NODE_VERSION = "22.14.0";

// ../node_modules/unenv/dist/runtime/node/internal/process/process.mjs
var Process = class _Process extends EventEmitter {
  static {
    __name(this, "Process");
  }
  env;
  hrtime;
  nextTick;
  constructor(impl) {
    super();
    this.env = impl.env;
    this.hrtime = impl.hrtime;
    this.nextTick = impl.nextTick;
    for (const prop of [...Object.getOwnPropertyNames(_Process.prototype), ...Object.getOwnPropertyNames(EventEmitter.prototype)]) {
      const value = this[prop];
      if (typeof value === "function") {
        this[prop] = value.bind(this);
      }
    }
  }
  // --- event emitter ---
  emitWarning(warning, type, code) {
    console.warn(`${code ? `[${code}] ` : ""}${type ? `${type}: ` : ""}${warning}`);
  }
  emit(...args) {
    return super.emit(...args);
  }
  listeners(eventName) {
    return super.listeners(eventName);
  }
  // --- stdio (lazy initializers) ---
  #stdin;
  #stdout;
  #stderr;
  get stdin() {
    return this.#stdin ??= new ReadStream(0);
  }
  get stdout() {
    return this.#stdout ??= new WriteStream(1);
  }
  get stderr() {
    return this.#stderr ??= new WriteStream(2);
  }
  // --- cwd ---
  #cwd = "/";
  chdir(cwd2) {
    this.#cwd = cwd2;
  }
  cwd() {
    return this.#cwd;
  }
  // --- dummy props and getters ---
  arch = "";
  platform = "";
  argv = [];
  argv0 = "";
  execArgv = [];
  execPath = "";
  title = "";
  pid = 200;
  ppid = 100;
  get version() {
    return `v${NODE_VERSION}`;
  }
  get versions() {
    return { node: NODE_VERSION };
  }
  get allowedNodeEnvironmentFlags() {
    return /* @__PURE__ */ new Set();
  }
  get sourceMapsEnabled() {
    return false;
  }
  get debugPort() {
    return 0;
  }
  get throwDeprecation() {
    return false;
  }
  get traceDeprecation() {
    return false;
  }
  get features() {
    return {};
  }
  get release() {
    return {};
  }
  get connected() {
    return false;
  }
  get config() {
    return {};
  }
  get moduleLoadList() {
    return [];
  }
  constrainedMemory() {
    return 0;
  }
  availableMemory() {
    return 0;
  }
  uptime() {
    return 0;
  }
  resourceUsage() {
    return {};
  }
  // --- noop methods ---
  ref() {
  }
  unref() {
  }
  // --- unimplemented methods ---
  umask() {
    throw createNotImplementedError("process.umask");
  }
  getBuiltinModule() {
    return void 0;
  }
  getActiveResourcesInfo() {
    throw createNotImplementedError("process.getActiveResourcesInfo");
  }
  exit() {
    throw createNotImplementedError("process.exit");
  }
  reallyExit() {
    throw createNotImplementedError("process.reallyExit");
  }
  kill() {
    throw createNotImplementedError("process.kill");
  }
  abort() {
    throw createNotImplementedError("process.abort");
  }
  dlopen() {
    throw createNotImplementedError("process.dlopen");
  }
  setSourceMapsEnabled() {
    throw createNotImplementedError("process.setSourceMapsEnabled");
  }
  loadEnvFile() {
    throw createNotImplementedError("process.loadEnvFile");
  }
  disconnect() {
    throw createNotImplementedError("process.disconnect");
  }
  cpuUsage() {
    throw createNotImplementedError("process.cpuUsage");
  }
  setUncaughtExceptionCaptureCallback() {
    throw createNotImplementedError("process.setUncaughtExceptionCaptureCallback");
  }
  hasUncaughtExceptionCaptureCallback() {
    throw createNotImplementedError("process.hasUncaughtExceptionCaptureCallback");
  }
  initgroups() {
    throw createNotImplementedError("process.initgroups");
  }
  openStdin() {
    throw createNotImplementedError("process.openStdin");
  }
  assert() {
    throw createNotImplementedError("process.assert");
  }
  binding() {
    throw createNotImplementedError("process.binding");
  }
  // --- attached interfaces ---
  permission = { has: /* @__PURE__ */ notImplemented("process.permission.has") };
  report = {
    directory: "",
    filename: "",
    signal: "SIGUSR2",
    compact: false,
    reportOnFatalError: false,
    reportOnSignal: false,
    reportOnUncaughtException: false,
    getReport: /* @__PURE__ */ notImplemented("process.report.getReport"),
    writeReport: /* @__PURE__ */ notImplemented("process.report.writeReport")
  };
  finalization = {
    register: /* @__PURE__ */ notImplemented("process.finalization.register"),
    unregister: /* @__PURE__ */ notImplemented("process.finalization.unregister"),
    registerBeforeExit: /* @__PURE__ */ notImplemented("process.finalization.registerBeforeExit")
  };
  memoryUsage = Object.assign(() => ({
    arrayBuffers: 0,
    rss: 0,
    external: 0,
    heapTotal: 0,
    heapUsed: 0
  }), { rss: /* @__PURE__ */ __name(() => 0, "rss") });
  // --- undefined props ---
  mainModule = void 0;
  domain = void 0;
  // optional
  send = void 0;
  exitCode = void 0;
  channel = void 0;
  getegid = void 0;
  geteuid = void 0;
  getgid = void 0;
  getgroups = void 0;
  getuid = void 0;
  setegid = void 0;
  seteuid = void 0;
  setgid = void 0;
  setgroups = void 0;
  setuid = void 0;
  // internals
  _events = void 0;
  _eventsCount = void 0;
  _exiting = void 0;
  _maxListeners = void 0;
  _debugEnd = void 0;
  _debugProcess = void 0;
  _fatalException = void 0;
  _getActiveHandles = void 0;
  _getActiveRequests = void 0;
  _kill = void 0;
  _preload_modules = void 0;
  _rawDebug = void 0;
  _startProfilerIdleNotifier = void 0;
  _stopProfilerIdleNotifier = void 0;
  _tickCallback = void 0;
  _disconnect = void 0;
  _handleQueue = void 0;
  _pendingMessage = void 0;
  _channel = void 0;
  _send = void 0;
  _linkedBinding = void 0;
};

// ../node_modules/wrangler/node_modules/@cloudflare/unenv-preset/dist/runtime/node/process.mjs
var globalProcess = globalThis["process"];
var getBuiltinModule = globalProcess.getBuiltinModule;
var workerdProcess = getBuiltinModule("node:process");
var unenvProcess = new Process({
  env: globalProcess.env,
  hrtime,
  // `nextTick` is available from workerd process v1
  nextTick: workerdProcess.nextTick
});
var { exit, features, platform } = workerdProcess;
var {
  _channel,
  _debugEnd,
  _debugProcess,
  _disconnect,
  _events,
  _eventsCount,
  _exiting,
  _fatalException,
  _getActiveHandles,
  _getActiveRequests,
  _handleQueue,
  _kill,
  _linkedBinding,
  _maxListeners,
  _pendingMessage,
  _preload_modules,
  _rawDebug,
  _send,
  _startProfilerIdleNotifier,
  _stopProfilerIdleNotifier,
  _tickCallback,
  abort,
  addListener,
  allowedNodeEnvironmentFlags,
  arch,
  argv,
  argv0,
  assert: assert2,
  availableMemory,
  binding,
  channel,
  chdir,
  config,
  connected,
  constrainedMemory,
  cpuUsage,
  cwd,
  debugPort,
  disconnect,
  dlopen,
  domain,
  emit,
  emitWarning,
  env,
  eventNames,
  execArgv,
  execPath,
  exitCode,
  finalization,
  getActiveResourcesInfo,
  getegid,
  geteuid,
  getgid,
  getgroups,
  getMaxListeners,
  getuid,
  hasUncaughtExceptionCaptureCallback,
  hrtime: hrtime3,
  initgroups,
  kill,
  listenerCount,
  listeners,
  loadEnvFile,
  mainModule,
  memoryUsage,
  moduleLoadList,
  nextTick,
  off,
  on,
  once,
  openStdin,
  permission,
  pid,
  ppid,
  prependListener,
  prependOnceListener,
  rawListeners,
  reallyExit,
  ref,
  release,
  removeAllListeners,
  removeListener,
  report,
  resourceUsage,
  send,
  setegid,
  seteuid,
  setgid,
  setgroups,
  setMaxListeners,
  setSourceMapsEnabled,
  setuid,
  setUncaughtExceptionCaptureCallback,
  sourceMapsEnabled,
  stderr,
  stdin,
  stdout,
  throwDeprecation,
  title,
  traceDeprecation,
  umask,
  unref,
  uptime,
  version,
  versions
} = unenvProcess;
var _process = {
  abort,
  addListener,
  allowedNodeEnvironmentFlags,
  hasUncaughtExceptionCaptureCallback,
  setUncaughtExceptionCaptureCallback,
  loadEnvFile,
  sourceMapsEnabled,
  arch,
  argv,
  argv0,
  chdir,
  config,
  connected,
  constrainedMemory,
  availableMemory,
  cpuUsage,
  cwd,
  debugPort,
  dlopen,
  disconnect,
  emit,
  emitWarning,
  env,
  eventNames,
  execArgv,
  execPath,
  exit,
  finalization,
  features,
  getBuiltinModule,
  getActiveResourcesInfo,
  getMaxListeners,
  hrtime: hrtime3,
  kill,
  listeners,
  listenerCount,
  memoryUsage,
  nextTick,
  on,
  off,
  once,
  pid,
  platform,
  ppid,
  prependListener,
  prependOnceListener,
  rawListeners,
  release,
  removeAllListeners,
  removeListener,
  report,
  resourceUsage,
  setMaxListeners,
  setSourceMapsEnabled,
  stderr,
  stdin,
  stdout,
  title,
  throwDeprecation,
  traceDeprecation,
  umask,
  uptime,
  version,
  versions,
  // @ts-expect-error old API
  domain,
  initgroups,
  moduleLoadList,
  reallyExit,
  openStdin,
  assert: assert2,
  binding,
  send,
  exitCode,
  channel,
  getegid,
  geteuid,
  getgid,
  getgroups,
  getuid,
  setegid,
  seteuid,
  setgid,
  setgroups,
  setuid,
  permission,
  mainModule,
  _events,
  _eventsCount,
  _exiting,
  _maxListeners,
  _debugEnd,
  _debugProcess,
  _fatalException,
  _getActiveHandles,
  _getActiveRequests,
  _kill,
  _preload_modules,
  _rawDebug,
  _startProfilerIdleNotifier,
  _stopProfilerIdleNotifier,
  _tickCallback,
  _disconnect,
  _handleQueue,
  _pendingMessage,
  _channel,
  _send,
  _linkedBinding
};
var process_default = _process;

// ../node_modules/wrangler/_virtual_unenv_global_polyfill-@cloudflare-unenv-preset-node-process
globalThis.process = process_default;

// _utils/algorithm.js
var SCORING_WEIGHTS = {
  VIEW: 1,
  READ: 5,
  SHARE: 10,
  TIME_SPENT_FACTOR: 0.1,
  TIER_1_CONTENT_MATCH: 35,
  // Increased: Text relevance 
  TIER_1_VISUAL_TRIGGER: 35,
  // Increased: Amygdala/Visual hijack 
  TIER_2_SESSION_HABIT: 15,
  TIER_3_WORLDWIDE_VOTE: 15,
  NOVELTY_BONUS: 10,
  // Updated: Dopamine exploration reward
  EMOTIONAL_RESONANCE: 10
  // NEW: Emotional intensity weight
};
var NeuralEngine = class {
  static {
    __name(this, "NeuralEngine");
  }
  static async getTextEmbedding(env2, text) {
    if (!text) return null;
    const cleanText = text.replace(/<[^>]*>?/gm, " ").substring(0, 3e3);
    try {
      const response = await env2.AI.run("@cf/baai/bge-base-en-v1.5", { text: cleanText });
      return response.data[0];
    } catch (e) {
      console.error("[AI ERROR] Text Embedding failed:", e.message);
      return null;
    }
  }
  static async getVisualEmbedding(env2, imageArrayBuffer) {
    if (!imageArrayBuffer) return null;
    try {
      const response = await env2.AI.run("@cf/openai/clip-vit-base-patch32", { image: [...new Uint8Array(imageArrayBuffer)] });
      return Array.isArray(response.data[0]) ? response.data[0] : response.data;
    } catch (e) {
      console.error("[AI ERROR] Visual Embedding failed:", e.message);
      return null;
    }
  }
  // ENHANCED: Applies a non-linear learning curve based on Hebbian principles
  static updateBrainVector(currentVector, newVector, actionWeight = 0.1, dimensions = 768) {
    if (!currentVector || currentVector.length !== dimensions) return newVector;
    if (!newVector || newVector.length !== dimensions) return currentVector;
    const alpha = Math.max(0.01, Math.min(0.2 * Math.log10(actionWeight * 10 + 1), 0.8));
    return currentVector.map(
      (val, i) => alpha * (newVector[i] || 0) + (1 - alpha) * val
    );
  }
  // NEW: Neural Action Potential Threshold
  static sigmoid(x) {
    return 1 / (1 + Math.exp(-x));
  }
};
var TemporalGravity = class {
  static {
    __name(this, "TemporalGravity");
  }
  static newtonianCooling(initialTemperature, ageInHours, k = 0.1) {
    const ambientTemperature = 0;
    return ambientTemperature + (initialTemperature - ambientTemperature) * Math.exp(-k * ageInHours);
  }
  // ENHANCED: Slightly sharper decay to prioritize fresh dopamine triggers
  static hackerNewsGravity(points, hoursSinceSubmit, gravity = 1.85) {
    return (points - 1) / Math.pow(hoursSinceSubmit + 1.5, gravity);
  }
};
var ContentIQ = class {
  static {
    __name(this, "ContentIQ");
  }
  static countSyllables(word) {
    word = word.toLowerCase();
    if (word.length <= 3) return 1;
    word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "");
    word = word.replace(/^y/, "");
    const syllables = word.match(/[aeiouy]{1,2}/g);
    return syllables ? syllables.length : 1;
  }
  static calculateGradeLevel(text) {
    if (!text) return 0;
    const sentences = text.split(/[.!?]+/).length || 1;
    const words = text.split(/\s+/).filter((w) => w.length > 0);
    const wordCount = words.length || 1;
    let syllableCount = 0;
    for (const w of words) syllableCount += this.countSyllables(w);
    const score = 0.39 * (wordCount / sentences) + 11.8 * (syllableCount / wordCount) - 15.59;
    return Math.max(0, Math.min(score, 20));
  }
  static calculateEntropy(text) {
    if (!text) return 0;
    const len = text.length;
    const frequencies = {};
    for (let i = 0; i < len; i++) {
      const char = text.charAt(i);
      frequencies[char] = (frequencies[char] || 0) + 1;
    }
    let entropy = 0;
    for (const count3 of Object.values(frequencies)) {
      const p = count3 / len;
      entropy -= p * Math.log2(p);
    }
    return entropy;
  }
  static analyzeSentiment(text) {
    if (!text) return { valence: 0, intensity: 0 };
    const lexicon = {
      "amazing": 4,
      "brilliant": 4,
      "excellent": 3,
      "fantastic": 4,
      "incredible": 4,
      "miracle": 4,
      "perfect": 3,
      "spectacular": 4,
      "wonderful": 4,
      "glorious": 4,
      "ecstatic": 4,
      "thrilled": 4,
      "delighted": 3,
      "love": 3,
      "beautiful": 3,
      "gorgeous": 3,
      "astonishing": 4,
      "joy": 3,
      "happy": 3,
      "great": 3,
      "good": 2,
      "terrible": -4,
      "awful": -4,
      "horrible": -4,
      "tragic": -4,
      "devastating": -4,
      "appalling": -4,
      "disgusting": -4,
      "hideous": -4,
      "ruined": -3,
      "outrageous": -3,
      "catastrophe": -4,
      "frightening": -3,
      "sorrow": -3,
      "terrified": -4,
      "panic": -3,
      "angry": -3,
      "furious": -4,
      "hate": -3,
      "disaster": -4,
      "bad": -2,
      "sad": -2,
      "fear": -3,
      "worst": -4,
      "dead": -3,
      "murder": -4,
      "destroy": -3,
      "fail": -2
    };
    const words = text.toLowerCase().split(/\W+/);
    let totalValence = 0;
    let wordCount = 0;
    for (const w of words) {
      if (w.length > 2) {
        wordCount++;
        if (lexicon[w]) {
          totalValence += lexicon[w];
        }
      }
    }
    if (wordCount === 0) return { valence: 0, intensity: 0 };
    const avgValence = totalValence / Math.max(1, wordCount * 0.05);
    const intensity = Math.min(1, Math.abs(avgValence) / 4);
    return { valence: avgValence, intensity };
  }
};
var RecommendationEngine = class {
  static {
    __name(this, "RecommendationEngine");
  }
  constructor(articles) {
    this.articles = articles || [];
  }
  _hash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  }
  getTrending(limit = 100) {
    return this.articles.map((article) => {
      let score = 0;
      if (article.engagement_score) {
        const hoursOld = Math.max(0, (Date.now() - new Date(article.published_at || Date.now())) / 36e5);
        score = TemporalGravity.hackerNewsGravity(article.engagement_score, hoursOld, 1.85);
      }
      const chronScore = new Date(article.published_at || Date.now()).getTime() / 1e10;
      return { ...article, _trending_score: score + chronScore };
    }).sort((a, b) => b._trending_score - a._trending_score).slice(0, limit);
  }
  getHybridRecommendations(textMatches, visualMatches, limit = 6, currentSlug = null) {
    const safeTextMatches = textMatches || [];
    const safeVisualMatches = visualMatches || [];
    const isAiActive = safeTextMatches.length > 0 || safeVisualMatches.length > 0;
    return this.articles.map((article) => {
      if (currentSlug && article.slug === currentSlug) return null;
      let relevance = 0;
      const scoreBreakdown = {
        text_ai: 0,
        visual_ai: 0,
        gravity: 0,
        emotion: 0,
        novelty: 0
      };
      const aiTextMatch = safeTextMatches.find((v) => v.id === article.slug);
      if (aiTextMatch) {
        const activatedScore = NeuralEngine.sigmoid(aiTextMatch.score * 5 - 2.5);
        scoreBreakdown.text_ai = activatedScore * SCORING_WEIGHTS.TIER_1_CONTENT_MATCH;
        relevance += scoreBreakdown.text_ai;
      }
      const aiVisualMatch = safeVisualMatches.find((v) => v.id === article.slug);
      if (aiVisualMatch) {
        const activatedScore = NeuralEngine.sigmoid(aiVisualMatch.score * 5 - 2.5);
        scoreBreakdown.visual_ai = activatedScore * SCORING_WEIGHTS.TIER_1_VISUAL_TRIGGER;
        relevance += scoreBreakdown.visual_ai;
      }
      if (article.engagement_score) {
        const hoursOld = Math.max(0, (Date.now() - new Date(article.published_at || Date.now())) / 36e5);
        const gravityScore = TemporalGravity.hackerNewsGravity(article.engagement_score, hoursOld, 1.85);
        const normalizedGravity = Math.min(1, Math.log10(gravityScore + 1.5) / 2);
        scoreBreakdown.gravity = normalizedGravity * SCORING_WEIGHTS.TIER_3_WORLDWIDE_VOTE;
        relevance += scoreBreakdown.gravity;
      }
      const sentiment = ContentIQ.analyzeSentiment(article.content_html || article.seo_description || article.title || "");
      scoreBreakdown.emotion = sentiment.intensity * SCORING_WEIGHTS.EMOTIONAL_RESONANCE;
      relevance += scoreBreakdown.emotion;
      if (currentSlug) {
        let novelty = 1;
        if (aiTextMatch) {
          novelty = Math.max(0, 1 - aiTextMatch.score);
        }
        const invertedU = Math.exp(-Math.pow(novelty - 0.3, 2) / 0.05);
        scoreBreakdown.novelty = invertedU * SCORING_WEIGHTS.NOVELTY_BONUS;
        relevance += scoreBreakdown.novelty;
      }
      return {
        ...article,
        _relevance: relevance,
        _ai_active: isAiActive,
        _scoring_breakdown: scoreBreakdown
      };
    }).filter((article) => article !== null).sort((a, b) => b._relevance - a._relevance).slice(0, limit);
  }
  getHybridVideoRecommendations(textMatches, visualMatches, limit = 6, currentSlug = null) {
    const deepPool = this.getHybridRecommendations(textMatches, visualMatches, limit * 4, currentSlug);
    const videoArticles = deepPool.filter(
      (article) => article.content_html && (article.content_html.includes("<video") || article.content_html.includes("iframe"))
    );
    const textArticles = deepPool.filter(
      (article) => !(article.content_html && (article.content_html.includes("<video") || article.content_html.includes("iframe")))
    );
    return [...videoArticles, ...textArticles].slice(0, limit);
  }
};
async function fetchCandidates(env2, limit = 100, searchQuery = null) {
  let results = [];
  const selectClause = `
    SELECT a.slug, a.title, a.subtitle, a.author, a.published_at, a.read_time_minutes, a.image_url, a.tags, a.seo_description,
           a.content_html, 
           COALESCE(a.engagement_score, 0) as engagement_score,
           COALESCE(a.avg_time_spent, 0) as avg_time_spent,
           COALESCE(a.total_views, 0) as _raw_views,
           COALESCE(a.trending_velocity, 0) as trending_velocity,
           a.neural_vector, a.visual_vector
    FROM articles a
  `;
  try {
    if (searchQuery) {
      const q = searchQuery.trim();
      const wildcard = `%${q.replace(/%/g, "\\%").replace(/_/g, "\\_")}%`;
      const sql = `${selectClause} WHERE (a.title LIKE ? ESCAPE '\\' OR a.subtitle LIKE ? ESCAPE '\\' OR a.seo_description LIKE ? ESCAPE '\\') ORDER BY a.published_at DESC LIMIT ?`;
      const { results: raw } = await env2.DB.prepare(sql).bind(wildcard, wildcard, wildcard, limit).all();
      results = raw || [];
    } else {
      const sql = `${selectClause} ORDER BY a.engagement_score DESC, a.published_at DESC LIMIT ?`;
      const { results: raw } = await env2.DB.prepare(sql).bind(limit).all();
      results = raw || [];
    }
  } catch (err) {
    console.error("[DB ERROR] fetchCandidates failed:", err.message);
    return [];
  }
  return results;
}
__name(fetchCandidates, "fetchCandidates");

// api/admin/sync-vectors.js
async function onRequestGet(context2) {
  const { env: env2, request } = context2;
  const url = new URL(request.url);
  if (url.searchParams.get("secret") !== "opentuwa-activate") {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }
  try {
    const { results } = await env2.DB.prepare(`
      SELECT slug, title, seo_description, content_html, image_url, neural_vector, visual_vector 
      FROM articles 
      WHERE neural_vector IS NULL OR visual_vector IS NULL 
      LIMIT 100
    `).all();
    if (!results || results.length === 0) {
      return new Response(JSON.stringify({
        status: "\u{1F7E2} ONLINE",
        message: "All articles have been processed. The AI is fully active!"
      }), { headers: { "Content-Type": "application/json" } });
    }
    const processed = [];
    const CONCURRENCY = 10;
    const processArticle = /* @__PURE__ */ __name(async (article) => {
      let textVector = null;
      let visualVector = null;
      const textPromise = !article.neural_vector ? (async () => {
        const combinedText = `${article.title} ${article.seo_description || ""} ${article.content_html || ""}`.replace(/<[^>]*>?/gm, " ").substring(0, 3e3);
        return NeuralEngine.getTextEmbedding(env2, combinedText);
      })() : Promise.resolve(null);
      const visualPromise = !article.visual_vector && article.image_url ? (async () => {
        try {
          let imgUrl = article.image_url;
          if (imgUrl.startsWith("/")) {
            imgUrl = new URL(imgUrl, request.url).toString();
          }
          const imgRes = await fetch(imgUrl);
          if (!imgRes.ok) return null;
          const arrayBuffer = await imgRes.arrayBuffer();
          return NeuralEngine.getVisualEmbedding(env2, arrayBuffer);
        } catch (e) {
          console.error(`Failed to fetch image for ${article.slug}:`, e.message);
          return null;
        }
      })() : Promise.resolve(null);
      [textVector, visualVector] = await Promise.all([textPromise, visualPromise]);
      return { slug: article.slug, textVector, visualVector };
    }, "processArticle");
    for (let i = 0; i < results.length; i += CONCURRENCY) {
      const chunk = results.slice(i, i + CONCURRENCY);
      const chunkResults = await Promise.all(chunk.map((article) => processArticle(article)));
      await Promise.all(chunkResults.map(async ({ slug, textVector, visualVector }) => {
        if (!textVector && !visualVector) return;
        const updateQueries = [];
        const bindParams = [];
        if (textVector) {
          updateQueries.push("neural_vector = ?");
          bindParams.push(JSON.stringify(textVector));
          await env2.VECTORIZE_TEXT.upsert([{ id: slug, values: textVector }]);
        }
        if (visualVector) {
          updateQueries.push("visual_vector = ?");
          bindParams.push(JSON.stringify(visualVector));
          await env2.VECTORIZE_VISION.upsert([{ id: slug, values: visualVector }]);
        }
        bindParams.push(slug);
        await env2.DB.prepare(`UPDATE articles SET ${updateQueries.join(", ")} WHERE slug = ?`).bind(...bindParams).run();
        processed.push(slug);
      }));
    }
    return new Response(JSON.stringify({
      status: "\u2699\uFE0F PROCESSING",
      message: `Successfully generated AI brain vectors for ${processed.length} articles.`,
      processed_slugs: processed,
      action_required: processed.length < results.length ? "Refresh this page to process the next batch." : "All fetched articles have been processed."
    }), { headers: { "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message, stack: err.stack }), { status: 500 });
  }
}
__name(onRequestGet, "onRequestGet");

// api/article/[slug].js
async function onRequestGet2(context2) {
  const { env: env2, params } = context2;
  try {
    const { results } = await env2.DB.prepare("SELECT * FROM articles WHERE slug = ?").bind(params.slug).all();
    if (!results || results.length === 0) {
      return new Response(JSON.stringify({ error: "Article not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }
    return new Response(JSON.stringify(results[0]), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    console.error(`Error fetching article ${params.slug}:`, err);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
__name(onRequestGet2, "onRequestGet");

// api/article.js
async function onRequestGet3(context2) {
  const { env: env2 } = context2;
  try {
    const url = new URL(context2.request.url);
    const q = (url.searchParams.get("q") || "").trim();
    const rawResults = await fetchCandidates(env2, 100, q);
    const engine = new RecommendationEngine(rawResults);
    const finalResults = engine.getTrending(100);
    return new Response(JSON.stringify(finalResults), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    console.error("API Article Error:", err.message, err.stack);
    return new Response(JSON.stringify([]), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
__name(onRequestGet3, "onRequestGet");

// api/author.js
async function onRequestGet4(context2) {
  const { request, env: env2 } = context2;
  const { searchParams } = new URL(request.url);
  const name = searchParams.get("name");
  try {
    if (!env2 || !env2.DB) throw new Error("DB not configured");
    if (!name) return Response.json({ error: "Missing author name" }, { status: 400 });
    const { results } = await env2.DB.prepare(
      "SELECT * FROM authors WHERE LOWER(name) = LOWER(?)"
    ).bind(name).all();
    if (!results || results.length === 0) {
      return new Response("Author not found", { status: 404 });
    }
    const row = results[0];
    const avatar_url = row.avatar_url || row.avatar || row.image_url || row.image || "";
    const normalized = { ...row, avatar_url };
    return Response.json(normalized);
  } catch (err) {
    const fallback = {
      name: name || "Guest Contributor",
      role: "Writer",
      bio: "An insightful contributor to the OpenTuwa network.",
      avatar_url: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop",
      social_link: "#"
    };
    return Response.json(fallback);
  }
}
__name(onRequestGet4, "onRequestGet");

// api/authors_1.js
async function onRequestGet5(context2) {
  const { env: env2, request } = context2;
  const { searchParams } = new URL(request.url);
  const nameFilter = searchParams.get("name");
  try {
    if (nameFilter) {
      const author = await env2.DB.prepare(
        "SELECT * FROM authors WHERE name = ?"
      ).bind(nameFilter).first();
      if (!author) {
        return new Response(JSON.stringify({ error: "Author not found" }), { status: 404 });
      }
      author.avatar = author.avatar_url;
      if (author.avatar && author.avatar.includes("jsdelivr")) {
        author.avatar = author.avatar.replace("https://cdn.jsdelivr.net/gh/OpenTuwa/OpenTuwaRe@main/", "/");
      }
      return Response.json(author);
    }
    const { results } = await env2.DB.prepare("SELECT * FROM authors ORDER BY id ASC").all();
    const authors = (results || []).map((a) => {
      a.avatar = a.avatar_url;
      if (a.avatar && a.avatar.includes("jsdelivr")) {
        a.avatar = a.avatar.replace("https://cdn.jsdelivr.net/gh/OpenTuwa/OpenTuwaRe@main/", "/");
      }
      return a;
    });
    return Response.json(authors);
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
__name(onRequestGet5, "onRequestGet");

// api/recommendations.js
async function onRequestGet6(context2) {
  const { env: env2 } = context2;
  const url = new URL(context2.request.url);
  const currentSlug = url.searchParams.get("slug");
  const sessionId = url.searchParams.get("session_id");
  const videoOnly = url.searchParams.get("video_only") === "true";
  if (!currentSlug) return new Response(JSON.stringify({ error: "Slug is required" }), { status: 400 });
  try {
    let userBrainVector = null;
    let userVisualVector = null;
    if (sessionId) {
      const sessionData = await env2.DB.prepare(`SELECT lexical_history, visual_history FROM algo_user_sessions WHERE session_id = ?`).bind(sessionId).first();
      if (sessionData) {
        if (sessionData.lexical_history) {
          try {
            const parsed = JSON.parse(sessionData.lexical_history);
            if (Array.isArray(parsed) && parsed.length === 768) userBrainVector = parsed;
          } catch (e) {
          }
        }
        if (sessionData.visual_history) {
          try {
            const parsed = JSON.parse(sessionData.visual_history);
            if (Array.isArray(parsed) && parsed.length === 512) userVisualVector = parsed;
          } catch (e) {
          }
        }
      }
    }
    if (currentSlug && (!userBrainVector || !userVisualVector)) {
      const articleData = await env2.DB.prepare(`SELECT neural_vector, visual_vector FROM articles WHERE slug = ?`).bind(currentSlug).first();
      if (articleData) {
        if (!userBrainVector && articleData.neural_vector) {
          try {
            const parsed = typeof articleData.neural_vector === "string" ? JSON.parse(articleData.neural_vector) : articleData.neural_vector;
            if (Array.isArray(parsed) && parsed.length === 768) userBrainVector = parsed;
          } catch (e) {
          }
        }
        if (!userVisualVector && articleData.visual_vector) {
          try {
            const parsed = typeof articleData.visual_vector === "string" ? JSON.parse(articleData.visual_vector) : articleData.visual_vector;
            if (Array.isArray(parsed) && parsed.length === 512) userVisualVector = parsed;
          } catch (e) {
          }
        }
      }
    }
    let aiTextMatches = [];
    let aiVisualMatches = [];
    const vectorTasks = [];
    if (userBrainVector && env2.VECTORIZE_TEXT) {
      vectorTasks.push(env2.VECTORIZE_TEXT.query(userBrainVector, { topK: 20 }).then((res) => aiTextMatches = res.matches || []).catch((err) => {
        console.error("Text vectorize failed:", err);
        return [];
      }));
    }
    if (userVisualVector && env2.VECTORIZE_VISION) {
      vectorTasks.push(env2.VECTORIZE_VISION.query(userVisualVector, { topK: 20 }).then((res) => aiVisualMatches = res.matches || []).catch((err) => {
        console.error("Visual vectorize failed:", err);
        return [];
      }));
    }
    await Promise.all(vectorTasks);
    const candidates = await fetchCandidates(env2, 100, null);
    if (!candidates || candidates.length === 0) {
      return new Response(JSON.stringify([]), { headers: { "Content-Type": "application/json" } });
    }
    const engine = new RecommendationEngine(candidates);
    let recommendations = [];
    try {
      recommendations = videoOnly ? engine.getHybridVideoRecommendations(aiTextMatches, aiVisualMatches, 24, currentSlug) : engine.getHybridRecommendations(aiTextMatches, aiVisualMatches, 24, currentSlug);
    } catch (engineError) {
      console.error("Recommendation Engine Logic Error:", engineError);
      recommendations = candidates.sort((a, b) => new Date(b.published_at) - new Date(a.published_at)).slice(0, 24);
    }
    const finalFeed = recommendations.slice(0, 24).map((article) => {
      const { neural_vector, visual_vector, ...cleanArticle } = article;
      return cleanArticle;
    });
    return new Response(JSON.stringify(finalFeed), { headers: { "Content-Type": "application/json" } });
  } catch (err) {
    console.error("Recs API Critical Error:", err);
    return new Response(JSON.stringify([]), { headers: { "Content-Type": "application/json" } });
  }
}
__name(onRequestGet6, "onRequestGet");

// api/subscribe.js
async function onRequestPost(context2) {
  const { env: env2, request } = context2;
  try {
    const { email } = await request.json();
    if (!email || !email.includes("@")) {
      return new Response(JSON.stringify({ error: "Please enter a valid email." }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    try {
      await env2.DB.prepare(
        "INSERT INTO subscribers (email) VALUES (?)"
      ).bind(email).run();
      return new Response(JSON.stringify({ success: true, message: "Welcome to the Lab!" }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    } catch (dbError) {
      if (dbError.message && dbError.message.includes("UNIQUE constraint")) {
        return new Response(JSON.stringify({ success: true, message: "You are already subscribed." }), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      }
      throw dbError;
    }
  } catch (err) {
    return new Response(JSON.stringify({ error: "Server error. Please try again." }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
__name(onRequestPost, "onRequestPost");

// api/subscribe_contribute.js
async function onRequestPost2(context2) {
  const { env: env2, request } = context2;
  try {
    const { email } = await request.json();
    if (!email || !email.includes("@")) {
      return new Response(JSON.stringify({ error: "Please enter a valid email." }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    try {
      await env2.DB.prepare(
        "INSERT INTO subscribers_contribute (email) VALUES (?)"
      ).bind(email).run();
      return new Response(JSON.stringify({ success: true, message: "Welcome to the Lab!" }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    } catch (dbError) {
      if (dbError.message && dbError.message.includes("UNIQUE constraint")) {
        return new Response(JSON.stringify({ success: true, message: "You are already subscribed." }), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      }
      throw dbError;
    }
  } catch (err) {
    return new Response(JSON.stringify({ error: "Server error. Please try again." }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
__name(onRequestPost2, "onRequestPost");

// api/track-interaction.js
async function onRequestPost3(context2) {
  const { request, env: env2 } = context2;
  try {
    const data = await request.json();
    const { action, slug, session_id, duration } = data;
    if (!slug || !action) return new Response(JSON.stringify({ error: "Missing fields" }), { status: 400 });
    const sid = session_id || "anonymous";
    if (sid === "anonymous") return new Response(JSON.stringify({ success: true }), { status: 200 });
    const sessionProfile = await env2.DB.prepare(`SELECT * FROM algo_user_sessions WHERE session_id = ?`).bind(sid).first();
    let userBrainVector = [];
    let userVisualVector = [];
    let baselineDwell = 5;
    if (sessionProfile) {
      try {
        userBrainVector = JSON.parse(sessionProfile.lexical_history || "[]");
      } catch (e) {
      }
      try {
        userVisualVector = JSON.parse(sessionProfile.visual_history || "[]");
      } catch (e) {
      }
      if (sessionProfile.total_interactions > 0) {
        baselineDwell = sessionProfile.total_time_spent / sessionProfile.total_interactions;
      }
    }
    let textLearningRate = 0;
    let visualLearningRate = 0;
    const activeDuration = duration || 1;
    const article = await env2.DB.prepare(`SELECT neural_vector, visual_vector, avg_time_spent FROM articles WHERE slug = ?`).bind(slug).first();
    let articleBaseline = 10;
    if (article && article.avg_time_spent > 0) {
      articleBaseline = article.avg_time_spent;
    }
    const expectedDwell = (baselineDwell + articleBaseline) / 2;
    const rpe = activeDuration - expectedDwell;
    let rpeMultiplier = 1;
    if (rpe > 0) {
      rpeMultiplier = 1 + 2 / (1 + Math.exp(-rpe / 15));
    } else {
      rpeMultiplier = Math.max(0.2, 1 + rpe / Math.max(expectedDwell, 1));
    }
    if (action === "view") {
      textLearningRate = 0.05;
      visualLearningRate = 0.1;
    } else if (action === "dwell_image") {
      visualLearningRate = Math.min(0.85, 0.2 * rpeMultiplier);
    } else if (action === "read") {
      textLearningRate = Math.min(0.8, 0.25 * rpeMultiplier);
    } else if (action === "share") {
      textLearningRate = 0.5;
      visualLearningRate = 0.5;
    }
    if ((textLearningRate > 0 || visualLearningRate > 0) && article) {
      if (textLearningRate > 0 && article.neural_vector) {
        try {
          const articleVector = JSON.parse(article.neural_vector);
          userBrainVector = NeuralEngine.updateBrainVector(userBrainVector, articleVector, textLearningRate, 768);
        } catch (e) {
        }
      }
      if (visualLearningRate > 0 && article.visual_vector) {
        try {
          const imgVector = JSON.parse(article.visual_vector);
          userVisualVector = NeuralEngine.updateBrainVector(userVisualVector, imgVector, visualLearningRate, 512);
        } catch (e) {
        }
      }
    }
    await env2.DB.prepare(`
      INSERT INTO algo_user_sessions (
        session_id, first_seen_at, last_seen_at, total_interactions, total_time_spent, lexical_history, visual_history
      ) VALUES (?, datetime('now'), datetime('now'), 1, ?, ?, ?)
      ON CONFLICT(session_id) DO UPDATE SET
        last_seen_at = datetime('now'),
        total_interactions = total_interactions + 1,
        total_time_spent = total_time_spent + excluded.total_time_spent,
        lexical_history = excluded.lexical_history,
        visual_history = excluded.visual_history
    `).bind(
      sid,
      action === "ping" || action === "dwell_image" || action === "read" ? activeDuration : 0,
      JSON.stringify(userBrainVector),
      JSON.stringify(userVisualVector)
    ).run();
    return new Response(JSON.stringify({ success: true, rpe_multiplier: rpeMultiplier }), { status: 200 });
  } catch (error3) {
    return new Response(JSON.stringify({ error: "Failed" }), { status: 500 });
  }
}
__name(onRequestPost3, "onRequestPost");

// api/get-author.js
async function onRequest(context2) {
  const { env: env2, request } = context2;
  const url = new URL(request.url);
  const name = url.searchParams.get("name");
  if (!name) {
    return new Response(JSON.stringify({ error: "Name is required" }), { status: 400 });
  }
  try {
    const { results } = await env2.DB.prepare(
      "SELECT * FROM authors WHERE name = ?"
    ).bind(name).all();
    if (!results || results.length === 0) {
      return new Response(JSON.stringify(null), { status: 200 });
    }
    return new Response(JSON.stringify(results[0]), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
__name(onRequest, "onRequest");

// player/[slug].js
async function onRequestGet7(context2) {
  const { env: env2, request, params } = context2;
  const slug = params.slug;
  let article = null;
  try {
    const { results } = await env2.DB.prepare(
      `SELECT title, seo_description, subtitle, image_url,
              author, published_at, tags
       FROM articles WHERE slug = ? LIMIT 1`
    ).bind(slug).all();
    article = results?.[0] || null;
  } catch (e) {
    return context2.next();
  }
  if (!article) return context2.next();
  const title2 = article.title || "Video";
  const desc = article.seo_description || article.subtitle || "";
  const image = article.image_url || "";
  const author = article.author || "OpenTuwa";
  const innerHtml = `
    <main style="max-width: 900px; margin: 0 auto; padding: 2rem 1.5rem;">
      <article>
        <h1>${esc(title2)}</h1>
        <p><strong>${esc(author)}</strong></p>
        <p>${esc(desc)}</p>
        ${image ? `<img src="${esc(image)}" style="max-width:100%; border-radius:8px;">` : ""}
      </article>
    </main>
  `;
  const response = await context2.next();
  if (!response.headers.get("content-type")?.includes("text/html")) {
    return new Response(innerHtml, { headers: { "content-type": "text/html" } });
  }
  return new HTMLRewriter().on("title", { element(e) {
    e.setInnerContent(title2 + " | OpenTuwa");
  } }).on('meta[name="description"]', { element(e) {
    e.setAttribute("content", desc);
  } }).on("div#root", { element(e) {
    e.setInnerContent(innerHtml, { html: true });
  } }).transform(response);
}
__name(onRequestGet7, "onRequestGet");
function esc(s) {
  return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
__name(esc, "esc");

// _utils/bot-detector.js
function isBot(request) {
  const ua = (request.headers.get("user-agent") || "").toLowerCase();
  return /googlebot|bingbot|duckduckbot|applebot|yandexbot|baiduspider|facebookexternalhit|twitterbot|linkedinbot|slackbot|telegrambot|whatsapp|oai-searchbot|chatgpt-user|gptbot|anthropic-ai|claude-web|perplexitybot|bytespider|google-extended|amazonbot|datajelly|ahrefsbot|semrushbot|dotbot|rogerbot|screaming frog|spider|crawler|curl|wget|python-requests/i.test(ua);
}
__name(isBot, "isBot");

// articles/[slug].js
async function onRequest2(context2) {
  const { env: env2, request, params } = context2;
  const slug = params.slug;
  if (!isBot(request)) {
    return context2.next();
  }
  let article = null;
  try {
    const { results } = await env2.DB.prepare(
      `SELECT title, seo_description, subtitle, image_url,
              author, published_at, content_html, tags
       FROM articles WHERE slug = ? LIMIT 1`
    ).bind(slug).all();
    article = results?.[0] || null;
  } catch (e) {
    return context2.next();
  }
  if (!article) return context2.next();
  const title2 = article.title || "Article";
  const desc = article.seo_description || article.subtitle || "";
  const image = article.image_url || "";
  const author = article.author || "OpenTuwa";
  const pubDate = article.published_at || "";
  const content = article.content_html || `<p>${esc2(desc)}</p>`;
  const botHtml = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${esc2(title2)} | OpenTuwa</title>
  <meta name="description" content="${esc2(desc)}">
  <style>
    :root { --bg: #0a0a0b; --text: #e5e5e5; --muted: #a1a1aa; --accent: #3b82f6; }
    body { background: var(--bg); color: var(--text); font-family: system-ui, sans-serif; line-height: 1.8; margin: 0; padding: 2rem; }
    article { max-width: 700px; margin: 0 auto; }
    h1 { color: #fff; font-size: 2.5rem; line-height: 1.2; margin-bottom: 0.5rem; }
    .meta { color: var(--muted); margin-bottom: 2rem; border-bottom: 1px solid #222; padding-bottom: 1rem; }
    img { max-width: 100%; height: auto; border-radius: 8px; margin: 2rem 0; }
    p { margin-bottom: 1.5rem; }
    a { color: var(--accent); }
  </style>
</head>
<body>
  <article>
    <nav><a href="/" style="color:#fff; font-weight:bold; text-decoration:none;">OpenTuwa</a></nav>
    <h1>${esc2(title2)}</h1>
    <div class="meta">By <strong>${esc2(author)}</strong> &bull; ${pubDate ? new Date(pubDate).toDateString() : ""}</div>
    ${image ? `<img src="${esc2(image)}" alt="${esc2(title2)}">` : ""}
    <div>${content}</div>
  </article>
</body>
</html>`;
  return new Response(botHtml, { headers: { "content-type": "text/html; charset=utf-8" } });
}
__name(onRequest2, "onRequest");
function esc2(s) {
  return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
__name(esc2, "esc");

// about.js
async function onRequestGet8(context2) {
  const { request } = context2;
  const title2 = "About OpenTuwa | Independent Journalism";
  const description = "OpenTuwa is an independent platform for long-form articles, research, and media exploring foundational ideas. Built for deep thought, not fast cycles.";
  const innerHtml = `
    <main style="max-width: 900px; margin: 0 auto; padding: 2rem 1.5rem;">
      <h1 style="color:#fff; border-bottom:1px solid #222; padding-bottom:1.5rem;">About OpenTuwa</h1>
      <div style="color:#e1e1e1; font-family:Inter, sans-serif; font-size:1.1rem; line-height:1.6;">
        <p style="font-size:1.3rem; margin-bottom:2rem;"><strong>OpenTuwa is an independent platform for long-form articles, research, and media exploring foundational ideas.</strong></p>
        <p>In an era of algorithmic echo chambers and 15-second attention spans, OpenTuwa stands as a sanctuary for substantive journalism.</p>
        <h2 style="color:#f0f0f0; margin-top:2rem;">Our Core Values</h2>
        <ul style="padding-left:1.5rem; margin-bottom:2rem;">
          <li><strong>Independence:</strong> Reader-supported.</li>
          <li><strong>Depth:</strong> Comprehensive analysis.</li>
          <li><strong>Transparency:</strong> Open algorithms.</li>
        </ul>
      </div>
    </main>
  `;
  const response = await context2.next();
  if (!response.headers.get("content-type")?.includes("text/html")) {
    return new Response(innerHtml, { headers: { "content-type": "text/html" } });
  }
  return new HTMLRewriter().on("title", { element(e) {
    e.setInnerContent(title2);
  } }).on('meta[name="description"]', { element(e) {
    e.setAttribute("content", description);
  } }).on("div#root", { element(e) {
    e.setInnerContent(innerHtml, { html: true });
  } }).transform(response);
}
__name(onRequestGet8, "onRequestGet");

// archive.js
async function onRequestGet9(context2) {
  const { env: env2 } = context2;
  const title2 = "Archive | OpenTuwa";
  const description = "A complete timeline of all articles, documentaries, and stories published on OpenTuwa.";
  let articles = [];
  try {
    const { results } = await env2.DB.prepare(
      "SELECT title, slug, published_at FROM articles ORDER BY published_at DESC"
    ).all();
    articles = results || [];
  } catch (err) {
    articles = [];
  }
  const grouped = articles.reduce((acc, article) => {
    const date = new Date(article.published_at || Date.now());
    const year = date.getFullYear();
    if (!acc[year]) acc[year] = [];
    acc[year].push(article);
    return acc;
  }, {});
  const years = Object.keys(grouped).sort((a, b) => b - a);
  const innerHtml = `
    <main style="max-width: 900px; margin: 0 auto; padding: 2rem 1.5rem;">
      <h1 style="color:#fff; border-bottom:1px solid #222; padding-bottom:1.5rem;">Archive</h1>
      <p style="color:#ccc; font-size:1.2rem; margin-bottom:2rem;">${description}</p>
      ${years.map((year) => `
        <section style="margin-bottom:3rem;">
          <h2 style="color:#888; font-size:2rem; margin-bottom:1rem; border-bottom:1px solid #222;">${year}</h2>
          <ul style="list-style:none; padding:0;">
            ${grouped[year].map((article) => `
              <li style="padding:0.75rem 0; border-bottom:1px solid #1a1a1a; display:flex; justify-content:space-between;">
                <a href="/articles/${article.slug}" style="color:#fff; text-decoration:none; font-size:1.1rem;">${article.title}</a>
                <small style="color:#666; font-family:monospace;">${new Date(article.published_at).toLocaleDateString()}</small>
              </li>
            `).join("")}
          </ul>
        </section>
      `).join("")}
    </main>
  `;
  const response = await context2.next();
  if (!response.headers.get("content-type")?.includes("text/html")) {
    return new Response(innerHtml, { headers: { "content-type": "text/html" } });
  }
  return new HTMLRewriter().on("title", { element(e) {
    e.setInnerContent(title2);
  } }).on('meta[name="description"]', { element(e) {
    e.setAttribute("content", description);
  } }).on("div#root", { element(e) {
    e.setInnerContent(innerHtml, { html: true });
  } }).transform(response);
}
__name(onRequestGet9, "onRequestGet");

// feed.xml.js
async function onRequestGet10(context2) {
  const { env: env2, request } = context2;
  const origin = new URL(request.url).origin;
  let articles = [];
  try {
    const { results } = await env2.DB.prepare(
      "SELECT slug, title, seo_description, subtitle, excerpt, author_name, author, published_at, created_at, date_published, image_url, content_html, tags, section, category FROM articles ORDER BY COALESCE(published_at, created_at, date_published) DESC LIMIT 50"
    ).bind().all();
    articles = results || [];
  } catch (e) {
    articles = [];
  }
  const now = (/* @__PURE__ */ new Date()).toUTCString();
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:media="http://search.yahoo.com/mrss/" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>OpenTuwa</title>
    <link>${esc3(origin)}</link>
    <description>Independent news and journalism covering stories that matter.</description>
    <language>en</language>
    <lastBuildDate>${esc3(now)}</lastBuildDate>
    <atom:link href="${esc3(origin + "/feed.xml")}" rel="self" type="application/rss+xml"/>
    <image>
      <url>./assets/ui/web.png</url>
      <title>OpenTuwa</title>
      <link>${esc3(origin)}</link>
    </image>`;
  for (const a of articles) {
    const link = origin + "/articles/" + a.slug;
    const pubDate = toRFC822(a.published_at || a.created_at || a.date_published) || now;
    const desc = a.seo_description || a.subtitle || a.excerpt || "Read the full article on OpenTuwa.";
    const author = a.author_name || a.author || "OpenTuwa";
    const imageUrl = a.image_url || "";
    const content = a.content_html || desc;
    let categories = [];
    if (a.section) categories.push(a.section);
    if (a.category && a.category !== a.section) categories.push(a.category);
    try {
      if (a.tags) {
        if (typeof a.tags === "string") {
          try {
            const parsed = JSON.parse(a.tags);
            if (Array.isArray(parsed)) categories.push(...parsed);
          } catch (e) {
            categories.push(...a.tags.split(","));
          }
        } else if (Array.isArray(a.tags)) {
          categories.push(...a.tags);
        }
      }
    } catch (e) {
    }
    categories = [...new Set(categories.map((c) => String(c).trim()).filter(Boolean))];
    xml += `
    <item>
      <title>${esc3(a.title || "Untitled")}</title>
      <link>${esc3(link)}</link>
      <guid isPermaLink="true">${esc3(link)}</guid>
      <pubDate>${esc3(pubDate)}</pubDate>
      <description>${esc3(desc)}</description>
      <dc:creator>${esc3(author)}</dc:creator>
      ${categories.map((c) => `<category>${esc3(c)}</category>`).join("")}
      <content:encoded><![CDATA[${content}]]></content:encoded>
      ${imageUrl ? `<media:content url="${esc3(imageUrl)}" medium="image"/>` : ""}
    </item>`;
  }
  xml += `
  </channel>
</rss>`;
  return new Response(xml, {
    headers: {
      "content-type": "application/rss+xml; charset=utf-8",
      "cache-control": "public, max-age=1800"
    }
  });
}
__name(onRequestGet10, "onRequestGet");
function esc3(s) {
  return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}
__name(esc3, "esc");
function toRFC822(val) {
  if (!val) return "";
  try {
    const d = new Date(val);
    return isNaN(d.getTime()) ? "" : d.toUTCString();
  } catch (e) {
    return "";
  }
}
__name(toRFC822, "toRFC822");

// legal.js
async function onRequestGet11(context2) {
  const title2 = "Legal | OpenTuwa";
  const description = "Terms of Service, Privacy Policy, and Legal Disclaimers for OpenTuwa.";
  const innerHtml = `
    <main style="max-width: 900px; margin: 0 auto; padding: 2rem 1.5rem;">
      <h1 style="color:#fff; border-bottom:1px solid #222; padding-bottom:1.5rem;">Legal Information</h1>
      <div style="color:#e1e1e1; font-family:Inter, sans-serif;">
        <div style="margin-bottom:3rem;">
          <h2 style="color:#f0f0f0; font-size:1.5rem;">Terms of Service</h2>
          <p>Effective as of: August 26, 2025</p>
          <p>Welcome to OpenTuwa...</p>
        </div>
        <div>
          <h2 style="color:#f0f0f0; font-size:1.5rem;">Privacy Policy</h2>
          <p>At OpenTuwa, we believe in data minimization...</p>
        </div>
      </div>
    </main>
  `;
  const response = await context2.next();
  if (!response.headers.get("content-type")?.includes("text/html")) {
    return new Response(innerHtml, { headers: { "content-type": "text/html" } });
  }
  return new HTMLRewriter().on("title", { element(e) {
    e.setInnerContent(title2);
  } }).on('meta[name="description"]', { element(e) {
    e.setAttribute("content", description);
  } }).on("div#root", { element(e) {
    e.setInnerContent(innerHtml, { html: true });
  } }).transform(response);
}
__name(onRequestGet11, "onRequestGet");

// news-sitemap.xml.js
async function onRequestGet12(context2) {
  const { env: env2, request } = context2;
  const origin = new URL(request.url).origin;
  const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1e3).toISOString();
  let articles = [];
  try {
    const { results } = await env2.DB.prepare(
      "SELECT slug, title, published_at, image_url FROM articles WHERE published_at >= ? ORDER BY published_at DESC LIMIT 1000"
    ).bind(cutoff).all();
    articles = results || [];
  } catch (e) {
    articles = [];
  }
  if (articles.length === 0) {
    try {
      const { results } = await env2.DB.prepare(
        "SELECT slug, title, published_at, image_url FROM articles ORDER BY published_at DESC LIMIT 1"
      ).all();
      articles = results || [];
    } catch (e) {
      articles = [];
    }
  }
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">`;
  for (const a of articles) {
    const isoDate = toISO(a.published_at);
    if (!isoDate) continue;
    const imageUrl = a.image_url ? a.image_url.startsWith("http") ? a.image_url : origin + a.image_url : "";
    xml += `
  <url>
    <loc>${esc4(origin + "/articles/" + a.slug)}</loc>
    <news:news>
      <news:publication>
        <news:name>OpenTuwa</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:publication_date>${esc4(isoDate)}</news:publication_date>
      <news:title>${esc4(a.title || "")}</news:title>
    </news:news>
    ${imageUrl ? `
    <image:image>
      <image:loc>${esc4(imageUrl)}</image:loc>
      <image:title>${esc4(a.title || "")}</image:title>
    </image:image>` : ""}
  </url>`;
  }
  if (!xml.includes("<url>")) {
    xml += `
  <url><loc>${esc4(origin)}</loc></url>`;
  }
  xml += `
</urlset>`;
  return new Response(xml, {
    headers: {
      "content-type": "application/xml; charset=utf-8",
      "cache-control": "public, max-age=900"
    }
  });
}
__name(onRequestGet12, "onRequestGet");
function esc4(s) {
  return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}
__name(esc4, "esc");
function toISO(val) {
  if (!val) return "";
  try {
    const d = new Date(val);
    return isNaN(d.getTime()) ? "" : d.toISOString();
  } catch (e) {
    return "";
  }
}
__name(toISO, "toISO");

// robots.txt.js
async function onRequestGet13(context2) {
  const { request } = context2;
  const origin = new URL(request.url).origin;
  const robotsTxt = `User-agent: *
Allow: /
Disallow: /search
Disallow: /api/

Sitemap: ${origin}/sitemap.xml
Sitemap: ${origin}/news-sitemap.xml
`;
  return new Response(robotsTxt, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=3600"
    }
  });
}
__name(onRequestGet13, "onRequestGet");

// sitemap.xml.js
async function onRequestGet14(context2) {
  const { env: env2, request } = context2;
  const origin = new URL(request.url).origin;
  let articles = [];
  try {
    const { results } = await env2.DB.prepare(
      "SELECT slug, published_at, image_url, title FROM articles ORDER BY published_at DESC"
    ).bind().all();
    articles = results || [];
  } catch (e) {
    articles = [];
  }
  const staticPages = ["/", "/about", "/archive", "/legal"];
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">`;
  for (const page of staticPages) {
    xml += `
  <url>
    <loc>${esc5(origin + page)}</loc>
    <changefreq>${page === "/" ? "daily" : "monthly"}</changefreq>
    <priority>${page === "/" ? "1.0" : "0.5"}</priority>
  </url>`;
  }
  for (const a of articles) {
    const lastmod = toISO2(a.published_at);
    xml += `
  <url>
    <loc>${esc5(origin + "/articles/" + a.slug)}</loc>${lastmod ? `
    <lastmod>${esc5(lastmod)}</lastmod>` : ""}
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
    ${a.image_url ? `
    <image:image>
      <image:loc>${esc5(a.image_url.startsWith("http") ? a.image_url : origin + a.image_url)}</image:loc>
      <image:title>${esc5(a.title || "")}</image:title>
    </image:image>` : ""}
  </url>`;
  }
  xml += `
</urlset>`;
  return new Response(xml, {
    headers: {
      "content-type": "application/xml; charset=utf-8",
      "cache-control": "public, max-age=3600"
    }
  });
}
__name(onRequestGet14, "onRequestGet");
function esc5(s) {
  return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}
__name(esc5, "esc");
function toISO2(val) {
  if (!val) return "";
  try {
    const d = new Date(val);
    return isNaN(d.getTime()) ? "" : d.toISOString();
  } catch (e) {
    return "";
  }
}
__name(toISO2, "toISO");

// index.js
async function onRequestGet15(context2) {
  const { request, env: env2 } = context2;
  if (!isBot(request)) {
    return context2.next();
  }
  const url = new URL(request.url);
  const author = url.searchParams.get("author");
  const tag = url.searchParams.get("tag");
  let articles = [];
  let pageTitle = "OpenTuwa - Independent Journalism & Documentaries";
  let pageDesc = "Discover stories, documentaries, and articles on OpenTuwa. Substantive journalism and rigorous intellectual inquiry.";
  let innerHtml = "";
  try {
    if (author && author.trim() !== "") {
      let a = null;
      try {
        const { results: results2 } = await env2.DB.prepare("SELECT * FROM authors WHERE LOWER(name) = LOWER(?)").bind(author).all();
        a = results2 && results2[0] || null;
      } catch (e) {
      }
      const name = a?.name || author;
      pageTitle = `${name} | OpenTuwa Author`;
      pageDesc = a?.bio || `Read articles and stories by ${name} on OpenTuwa.`;
      const { results } = await env2.DB.prepare("SELECT title, slug, subtitle, published_at FROM articles WHERE author = ? ORDER BY published_at DESC LIMIT 20").bind(name).all();
      articles = results || [];
      innerHtml = `<h1>${escapeHtml(name)}</h1><p class="lead">${escapeHtml(pageDesc)}</p><hr/><h2>Latest Stories</h2>${renderArticleList(articles)}`;
    } else if (tag && tag.trim() !== "") {
      pageTitle = `${tag} - Topic | OpenTuwa`;
      pageDesc = `Latest stories, documentaries and articles about ${tag}.`;
      const { results } = await env2.DB.prepare("SELECT title, slug, subtitle, published_at FROM articles WHERE tags LIKE ? ORDER BY published_at DESC LIMIT 20").bind(`%${tag}%`).all();
      articles = results || [];
      innerHtml = `<h1>Topic: ${escapeHtml(tag)}</h1><p class="lead">${escapeHtml(pageDesc)}</p><hr/>${renderArticleList(articles)}`;
    } else {
      const { results } = await env2.DB.prepare("SELECT title, slug, subtitle, published_at FROM articles ORDER BY published_at DESC LIMIT 20").all();
      articles = results || [];
      innerHtml = `<h1>Latest Stories</h1><p class="lead">${escapeHtml(pageDesc)}</p><hr/>${renderArticleList(articles)}`;
    }
  } catch (err) {
    return context2.next();
  }
  const botHtml = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(pageTitle)}</title>
  <meta name="description" content="${escapeHtml(pageDesc)}">
  <style>
    :root { --bg: #0a0a0b; --text: #e5e5e5; --muted: #a1a1aa; --accent: #3b82f6; }
    body { background: var(--bg); color: var(--text); font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; margin: 0; padding: 2rem; }
    main { max-width: 800px; margin: 0 auto; }
    h1 { color: #fff; font-size: 2.5rem; margin-bottom: 1rem; }
    h2 { color: #fff; margin-top: 2rem; }
    .lead { font-size: 1.25rem; color: var(--muted); margin-bottom: 2rem; }
    article { margin-bottom: 2rem; padding-bottom: 2rem; border-bottom: 1px solid #222; }
    article h3 { margin: 0 0 0.5rem 0; font-size: 1.5rem; }
    article a { color: #fff; text-decoration: none; }
    article a:hover { color: var(--accent); }
    .meta { font-size: 0.875rem; color: var(--muted); }
    hr { border: 0; border-top: 1px solid #222; margin: 2rem 0; }
  </style>
</head>
<body>
  <main>
    <nav><a href="/" style="color:#fff; font-weight:bold; text-decoration:none; font-size:1.5rem;">OpenTuwa</a></nav>
    ${innerHtml}
    <footer style="margin-top:4rem; font-size:0.8rem; color:var(--muted);">
      <p>&copy; ${(/* @__PURE__ */ new Date()).getFullYear()} OpenTuwa Media. <a href="/legal" style="color:var(--muted);">Legal</a> | <a href="/about" style="color:var(--muted);">About</a></p>
    </footer>
  </main>
</body>
</html>`;
  return new Response(botHtml, { headers: { "content-type": "text/html; charset=utf-8" } });
}
__name(onRequestGet15, "onRequestGet");
function renderArticleList(articles) {
  if (!articles || articles.length === 0) return "<p>No stories found.</p>";
  return articles.map((article) => `
    <article>
      <h3><a href="/articles/${escapeHtml(article.slug)}">${escapeHtml(article.title)}</a></h3>
      ${article.subtitle ? `<p>${escapeHtml(article.subtitle)}</p>` : ""}
      <div class="meta">${article.published_at ? new Date(article.published_at).toLocaleDateString() : ""}</div>
    </article>
  `).join("");
}
__name(renderArticleList, "renderArticleList");
function escapeHtml(str) {
  if (!str) return "";
  return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
__name(escapeHtml, "escapeHtml");

// ../.wrangler/tmp/pages-xg6fvE/functionsRoutes-0.2761949911950785.mjs
var routes = [
  {
    routePath: "/api/admin/sync-vectors",
    mountPath: "/api/admin",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet]
  },
  {
    routePath: "/api/article/:slug",
    mountPath: "/api/article",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet2]
  },
  {
    routePath: "/api/article",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet3]
  },
  {
    routePath: "/api/author",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet4]
  },
  {
    routePath: "/api/authors_1",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet5]
  },
  {
    routePath: "/api/recommendations",
    mountPath: "/api",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet6]
  },
  {
    routePath: "/api/subscribe",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost]
  },
  {
    routePath: "/api/subscribe_contribute",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost2]
  },
  {
    routePath: "/api/track-interaction",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost3]
  },
  {
    routePath: "/api/get-author",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest]
  },
  {
    routePath: "/player/:slug",
    mountPath: "/player",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet7]
  },
  {
    routePath: "/articles/:slug",
    mountPath: "/articles",
    method: "",
    middlewares: [],
    modules: [onRequest2]
  },
  {
    routePath: "/about",
    mountPath: "/",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet8]
  },
  {
    routePath: "/archive",
    mountPath: "/",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet9]
  },
  {
    routePath: "/feed.xml",
    mountPath: "/",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet10]
  },
  {
    routePath: "/legal",
    mountPath: "/",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet11]
  },
  {
    routePath: "/news-sitemap.xml",
    mountPath: "/",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet12]
  },
  {
    routePath: "/robots.txt",
    mountPath: "/",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet13]
  },
  {
    routePath: "/sitemap.xml",
    mountPath: "/",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet14]
  },
  {
    routePath: "/",
    mountPath: "/",
    method: "GET",
    middlewares: [],
    modules: [onRequestGet15]
  }
];

// ../node_modules/wrangler/node_modules/path-to-regexp/dist.es2015/index.js
function lexer(str) {
  var tokens = [];
  var i = 0;
  while (i < str.length) {
    var char = str[i];
    if (char === "*" || char === "+" || char === "?") {
      tokens.push({ type: "MODIFIER", index: i, value: str[i++] });
      continue;
    }
    if (char === "\\") {
      tokens.push({ type: "ESCAPED_CHAR", index: i++, value: str[i++] });
      continue;
    }
    if (char === "{") {
      tokens.push({ type: "OPEN", index: i, value: str[i++] });
      continue;
    }
    if (char === "}") {
      tokens.push({ type: "CLOSE", index: i, value: str[i++] });
      continue;
    }
    if (char === ":") {
      var name = "";
      var j = i + 1;
      while (j < str.length) {
        var code = str.charCodeAt(j);
        if (
          // `0-9`
          code >= 48 && code <= 57 || // `A-Z`
          code >= 65 && code <= 90 || // `a-z`
          code >= 97 && code <= 122 || // `_`
          code === 95
        ) {
          name += str[j++];
          continue;
        }
        break;
      }
      if (!name)
        throw new TypeError("Missing parameter name at ".concat(i));
      tokens.push({ type: "NAME", index: i, value: name });
      i = j;
      continue;
    }
    if (char === "(") {
      var count3 = 1;
      var pattern = "";
      var j = i + 1;
      if (str[j] === "?") {
        throw new TypeError('Pattern cannot start with "?" at '.concat(j));
      }
      while (j < str.length) {
        if (str[j] === "\\") {
          pattern += str[j++] + str[j++];
          continue;
        }
        if (str[j] === ")") {
          count3--;
          if (count3 === 0) {
            j++;
            break;
          }
        } else if (str[j] === "(") {
          count3++;
          if (str[j + 1] !== "?") {
            throw new TypeError("Capturing groups are not allowed at ".concat(j));
          }
        }
        pattern += str[j++];
      }
      if (count3)
        throw new TypeError("Unbalanced pattern at ".concat(i));
      if (!pattern)
        throw new TypeError("Missing pattern at ".concat(i));
      tokens.push({ type: "PATTERN", index: i, value: pattern });
      i = j;
      continue;
    }
    tokens.push({ type: "CHAR", index: i, value: str[i++] });
  }
  tokens.push({ type: "END", index: i, value: "" });
  return tokens;
}
__name(lexer, "lexer");
function parse(str, options) {
  if (options === void 0) {
    options = {};
  }
  var tokens = lexer(str);
  var _a = options.prefixes, prefixes = _a === void 0 ? "./" : _a, _b = options.delimiter, delimiter = _b === void 0 ? "/#?" : _b;
  var result = [];
  var key = 0;
  var i = 0;
  var path = "";
  var tryConsume = /* @__PURE__ */ __name(function(type) {
    if (i < tokens.length && tokens[i].type === type)
      return tokens[i++].value;
  }, "tryConsume");
  var mustConsume = /* @__PURE__ */ __name(function(type) {
    var value2 = tryConsume(type);
    if (value2 !== void 0)
      return value2;
    var _a2 = tokens[i], nextType = _a2.type, index = _a2.index;
    throw new TypeError("Unexpected ".concat(nextType, " at ").concat(index, ", expected ").concat(type));
  }, "mustConsume");
  var consumeText = /* @__PURE__ */ __name(function() {
    var result2 = "";
    var value2;
    while (value2 = tryConsume("CHAR") || tryConsume("ESCAPED_CHAR")) {
      result2 += value2;
    }
    return result2;
  }, "consumeText");
  var isSafe = /* @__PURE__ */ __name(function(value2) {
    for (var _i = 0, delimiter_1 = delimiter; _i < delimiter_1.length; _i++) {
      var char2 = delimiter_1[_i];
      if (value2.indexOf(char2) > -1)
        return true;
    }
    return false;
  }, "isSafe");
  var safePattern = /* @__PURE__ */ __name(function(prefix2) {
    var prev = result[result.length - 1];
    var prevText = prefix2 || (prev && typeof prev === "string" ? prev : "");
    if (prev && !prevText) {
      throw new TypeError('Must have text between two parameters, missing text after "'.concat(prev.name, '"'));
    }
    if (!prevText || isSafe(prevText))
      return "[^".concat(escapeString(delimiter), "]+?");
    return "(?:(?!".concat(escapeString(prevText), ")[^").concat(escapeString(delimiter), "])+?");
  }, "safePattern");
  while (i < tokens.length) {
    var char = tryConsume("CHAR");
    var name = tryConsume("NAME");
    var pattern = tryConsume("PATTERN");
    if (name || pattern) {
      var prefix = char || "";
      if (prefixes.indexOf(prefix) === -1) {
        path += prefix;
        prefix = "";
      }
      if (path) {
        result.push(path);
        path = "";
      }
      result.push({
        name: name || key++,
        prefix,
        suffix: "",
        pattern: pattern || safePattern(prefix),
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    var value = char || tryConsume("ESCAPED_CHAR");
    if (value) {
      path += value;
      continue;
    }
    if (path) {
      result.push(path);
      path = "";
    }
    var open = tryConsume("OPEN");
    if (open) {
      var prefix = consumeText();
      var name_1 = tryConsume("NAME") || "";
      var pattern_1 = tryConsume("PATTERN") || "";
      var suffix = consumeText();
      mustConsume("CLOSE");
      result.push({
        name: name_1 || (pattern_1 ? key++ : ""),
        pattern: name_1 && !pattern_1 ? safePattern(prefix) : pattern_1,
        prefix,
        suffix,
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    mustConsume("END");
  }
  return result;
}
__name(parse, "parse");
function match(str, options) {
  var keys = [];
  var re = pathToRegexp(str, keys, options);
  return regexpToFunction(re, keys, options);
}
__name(match, "match");
function regexpToFunction(re, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.decode, decode = _a === void 0 ? function(x) {
    return x;
  } : _a;
  return function(pathname) {
    var m = re.exec(pathname);
    if (!m)
      return false;
    var path = m[0], index = m.index;
    var params = /* @__PURE__ */ Object.create(null);
    var _loop_1 = /* @__PURE__ */ __name(function(i2) {
      if (m[i2] === void 0)
        return "continue";
      var key = keys[i2 - 1];
      if (key.modifier === "*" || key.modifier === "+") {
        params[key.name] = m[i2].split(key.prefix + key.suffix).map(function(value) {
          return decode(value, key);
        });
      } else {
        params[key.name] = decode(m[i2], key);
      }
    }, "_loop_1");
    for (var i = 1; i < m.length; i++) {
      _loop_1(i);
    }
    return { path, index, params };
  };
}
__name(regexpToFunction, "regexpToFunction");
function escapeString(str) {
  return str.replace(/([.+*?=^!:${}()[\]|/\\])/g, "\\$1");
}
__name(escapeString, "escapeString");
function flags(options) {
  return options && options.sensitive ? "" : "i";
}
__name(flags, "flags");
function regexpToRegexp(path, keys) {
  if (!keys)
    return path;
  var groupsRegex = /\((?:\?<(.*?)>)?(?!\?)/g;
  var index = 0;
  var execResult = groupsRegex.exec(path.source);
  while (execResult) {
    keys.push({
      // Use parenthesized substring match if available, index otherwise
      name: execResult[1] || index++,
      prefix: "",
      suffix: "",
      modifier: "",
      pattern: ""
    });
    execResult = groupsRegex.exec(path.source);
  }
  return path;
}
__name(regexpToRegexp, "regexpToRegexp");
function arrayToRegexp(paths, keys, options) {
  var parts = paths.map(function(path) {
    return pathToRegexp(path, keys, options).source;
  });
  return new RegExp("(?:".concat(parts.join("|"), ")"), flags(options));
}
__name(arrayToRegexp, "arrayToRegexp");
function stringToRegexp(path, keys, options) {
  return tokensToRegexp(parse(path, options), keys, options);
}
__name(stringToRegexp, "stringToRegexp");
function tokensToRegexp(tokens, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.strict, strict = _a === void 0 ? false : _a, _b = options.start, start = _b === void 0 ? true : _b, _c = options.end, end = _c === void 0 ? true : _c, _d = options.encode, encode = _d === void 0 ? function(x) {
    return x;
  } : _d, _e = options.delimiter, delimiter = _e === void 0 ? "/#?" : _e, _f = options.endsWith, endsWith = _f === void 0 ? "" : _f;
  var endsWithRe = "[".concat(escapeString(endsWith), "]|$");
  var delimiterRe = "[".concat(escapeString(delimiter), "]");
  var route = start ? "^" : "";
  for (var _i = 0, tokens_1 = tokens; _i < tokens_1.length; _i++) {
    var token = tokens_1[_i];
    if (typeof token === "string") {
      route += escapeString(encode(token));
    } else {
      var prefix = escapeString(encode(token.prefix));
      var suffix = escapeString(encode(token.suffix));
      if (token.pattern) {
        if (keys)
          keys.push(token);
        if (prefix || suffix) {
          if (token.modifier === "+" || token.modifier === "*") {
            var mod = token.modifier === "*" ? "?" : "";
            route += "(?:".concat(prefix, "((?:").concat(token.pattern, ")(?:").concat(suffix).concat(prefix, "(?:").concat(token.pattern, "))*)").concat(suffix, ")").concat(mod);
          } else {
            route += "(?:".concat(prefix, "(").concat(token.pattern, ")").concat(suffix, ")").concat(token.modifier);
          }
        } else {
          if (token.modifier === "+" || token.modifier === "*") {
            throw new TypeError('Can not repeat "'.concat(token.name, '" without a prefix and suffix'));
          }
          route += "(".concat(token.pattern, ")").concat(token.modifier);
        }
      } else {
        route += "(?:".concat(prefix).concat(suffix, ")").concat(token.modifier);
      }
    }
  }
  if (end) {
    if (!strict)
      route += "".concat(delimiterRe, "?");
    route += !options.endsWith ? "$" : "(?=".concat(endsWithRe, ")");
  } else {
    var endToken = tokens[tokens.length - 1];
    var isEndDelimited = typeof endToken === "string" ? delimiterRe.indexOf(endToken[endToken.length - 1]) > -1 : endToken === void 0;
    if (!strict) {
      route += "(?:".concat(delimiterRe, "(?=").concat(endsWithRe, "))?");
    }
    if (!isEndDelimited) {
      route += "(?=".concat(delimiterRe, "|").concat(endsWithRe, ")");
    }
  }
  return new RegExp(route, flags(options));
}
__name(tokensToRegexp, "tokensToRegexp");
function pathToRegexp(path, keys, options) {
  if (path instanceof RegExp)
    return regexpToRegexp(path, keys);
  if (Array.isArray(path))
    return arrayToRegexp(path, keys, options);
  return stringToRegexp(path, keys, options);
}
__name(pathToRegexp, "pathToRegexp");

// ../node_modules/wrangler/templates/pages-template-worker.ts
var escapeRegex = /[.+?^${}()|[\]\\]/g;
function* executeRequest(request) {
  const requestPath = new URL(request.url).pathname;
  for (const route of [...routes].reverse()) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult) {
      for (const handler of route.middlewares.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: mountMatchResult.path
        };
      }
    }
  }
  for (const route of routes) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: true
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult && route.modules.length) {
      for (const handler of route.modules.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: matchResult.path
        };
      }
      break;
    }
  }
}
__name(executeRequest, "executeRequest");
var pages_template_worker_default = {
  async fetch(originalRequest, env2, workerContext) {
    let request = originalRequest;
    const handlerIterator = executeRequest(request);
    let data = {};
    let isFailOpen = false;
    const next = /* @__PURE__ */ __name(async (input, init) => {
      if (input !== void 0) {
        let url = input;
        if (typeof input === "string") {
          url = new URL(input, request.url).toString();
        }
        request = new Request(url, init);
      }
      const result = handlerIterator.next();
      if (result.done === false) {
        const { handler, params, path } = result.value;
        const context2 = {
          request: new Request(request.clone()),
          functionPath: path,
          next,
          params,
          get data() {
            return data;
          },
          set data(value) {
            if (typeof value !== "object" || value === null) {
              throw new Error("context.data must be an object");
            }
            data = value;
          },
          env: env2,
          waitUntil: workerContext.waitUntil.bind(workerContext),
          passThroughOnException: /* @__PURE__ */ __name(() => {
            isFailOpen = true;
          }, "passThroughOnException")
        };
        const response = await handler(context2);
        if (!(response instanceof Response)) {
          throw new Error("Your Pages function should return a Response");
        }
        return cloneResponse(response);
      } else if ("ASSETS") {
        const response = await env2["ASSETS"].fetch(request);
        return cloneResponse(response);
      } else {
        const response = await fetch(request);
        return cloneResponse(response);
      }
    }, "next");
    try {
      return await next();
    } catch (error3) {
      if (isFailOpen) {
        const response = await env2["ASSETS"].fetch(request);
        return cloneResponse(response);
      }
      throw error3;
    }
  }
};
var cloneResponse = /* @__PURE__ */ __name((response) => (
  // https://fetch.spec.whatwg.org/#null-body-status
  new Response(
    [101, 204, 205, 304].includes(response.status) ? null : response.body,
    response
  )
), "cloneResponse");

// ../node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env2, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env2);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// ../node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env2, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env2);
  } catch (e) {
    const error3 = reduceError(e);
    return Response.json(error3, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// ../.wrangler/tmp/bundle-8R6KUJ/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = pages_template_worker_default;

// ../node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env2, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env2, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env2, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env2, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// ../.wrangler/tmp/bundle-8R6KUJ/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env2, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env2, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env2, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env2, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env2, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env2, ctx) => {
      this.env = env2;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=functionsWorker-0.19524278151475816.mjs.map
