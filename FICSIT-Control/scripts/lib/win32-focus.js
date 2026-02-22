/**
 * Win32 FFI module for window enumeration and focus management.
 * Uses koffi for direct user32.dll / kernel32.dll / psapi.dll calls.
 *
 * Exports:
 *   focusSatisfactoryWindow(options?) => FocusResult
 */

import koffi from 'koffi';

// ---------------------------------------------------------------------------
// DLL handles
// ---------------------------------------------------------------------------
const user32 = koffi.load('user32.dll');
const kernel32 = koffi.load('kernel32.dll');
const psapi = koffi.load('psapi.dll');

// ---------------------------------------------------------------------------
// Struct / callback types
// ---------------------------------------------------------------------------
const RECT = koffi.struct('RECT', {
  left: 'long',
  top: 'long',
  right: 'long',
  bottom: 'long',
});

const POINT = koffi.struct('POINT', {
  x: 'long',
  y: 'long',
});

// EnumWindows callback: BOOL CALLBACK EnumWindowsProc(HWND, LPARAM)
const EnumWindowsProc = koffi.proto('bool __stdcall EnumWindowsProc(void *hwnd, int64 lParam)');

// ---------------------------------------------------------------------------
// Win32 function declarations
// ---------------------------------------------------------------------------

// Window enumeration & info
const EnumWindows = user32.func('bool __stdcall EnumWindows(EnumWindowsProc *cb, int64 lParam)');
const GetWindowThreadProcessId = user32.func('uint32 __stdcall GetWindowThreadProcessId(void *hwnd, _Out_ uint32 *pid)');
const IsWindowVisible = user32.func('bool __stdcall IsWindowVisible(void *hwnd)');
const GetWindowTextW = user32.func('int __stdcall GetWindowTextW(void *hwnd, _Out_ uint16 *buf, int maxCount)');
const GetClassNameW = user32.func('int __stdcall GetClassNameW(void *hwnd, _Out_ uint16 *buf, int maxCount)');
const GetWindowRect = user32.func('bool __stdcall GetWindowRect(void *hwnd, _Out_ RECT *rect)');
const GetWindowLongPtrW = user32.func('int64 __stdcall GetWindowLongPtrW(void *hwnd, int nIndex)');
const IsIconic = user32.func('bool __stdcall IsIconic(void *hwnd)');

// Focus & foreground
const ShowWindow = user32.func('bool __stdcall ShowWindow(void *hwnd, int nCmdShow)');
const SetForegroundWindow = user32.func('bool __stdcall SetForegroundWindow(void *hwnd)');
const BringWindowToTop = user32.func('bool __stdcall BringWindowToTop(void *hwnd)');
const SetFocus = user32.func('void * __stdcall SetFocus(void *hwnd)');
const GetForegroundWindow = user32.func('void * __stdcall GetForegroundWindow()');
const SetActiveWindow = user32.func('void * __stdcall SetActiveWindow(void *hwnd)');

// Thread attachment
const AttachThreadInput = user32.func('bool __stdcall AttachThreadInput(uint32 idAttach, uint32 idAttachTo, bool fAttach)');
const GetCurrentThreadId = kernel32.func('uint32 __stdcall GetCurrentThreadId()');

// Keyboard simulation
const keybd_event = user32.func('void __stdcall keybd_event(uint8 bVk, uint8 bScan, uint32 dwFlags, uint64 dwExtraInfo)');

// Process info
const OpenProcess = kernel32.func('void * __stdcall OpenProcess(uint32 dwDesiredAccess, bool bInheritHandle, uint32 dwProcessId)');
const CloseHandle = kernel32.func('bool __stdcall CloseHandle(void *hObject)');
const GetModuleBaseNameW = psapi.func('uint32 __stdcall GetModuleBaseNameW(void *hProcess, void *hModule, _Out_ uint16 *lpBaseName, uint32 nSize)');
const GetLastError = kernel32.func('uint32 __stdcall GetLastError()');
const QueryFullProcessImageNameW = kernel32.func('bool __stdcall QueryFullProcessImageNameW(void *hProcess, uint32 dwFlags, _Out_ uint16 *lpExeName, _Inout_ uint32 *lpdwSize)');

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const GWL_EXSTYLE = -20;
const WS_EX_TOOLWINDOW = 0x00000080;
const WS_EX_NOACTIVATE = 0x08000000;
const SW_RESTORE = 9;
const VK_MENU = 0x12; // Alt key
const KEYEVENTF_KEYUP = 0x0002;
const PROCESS_QUERY_INFORMATION = 0x0400;
const PROCESS_VM_READ = 0x0010;

const CANDIDATE_PROCESS_NAMES = [
  'factorygamesteam-win64-shipping.exe',
  'factorygamesteam.exe',
  'factorygame-win64-shipping.exe',
  'factorygame.exe',
  'satisfactory.exe',
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Read a UTF-16LE buffer into a JS string. */
function readUtf16(buf, charCount) {
  return Buffer.from(buf.buffer, buf.byteOffset, charCount * 2).toString('utf16le');
}

/** Get the lowercase exe name for a PID, or null on failure. */
function getProcessName(pid) {
  // Try GetModuleBaseNameW first (needs PROCESS_QUERY_INFORMATION | PROCESS_VM_READ)
  let hProcess = OpenProcess(PROCESS_QUERY_INFORMATION | PROCESS_VM_READ, false, pid);
  if (hProcess) {
    try {
      const nameBuf = Buffer.alloc(520);
      const len = GetModuleBaseNameW(hProcess, null, nameBuf, 260);
      if (len > 0) return readUtf16(nameBuf, len).toLowerCase();
    } finally {
      CloseHandle(hProcess);
    }
  }

  // Fallback: QueryFullProcessImageNameW (needs only PROCESS_QUERY_LIMITED_INFORMATION)
  hProcess = OpenProcess(0x1000 /* PROCESS_QUERY_LIMITED_INFORMATION */, false, pid);
  if (hProcess) {
    try {
      const pathBuf = Buffer.alloc(1040);
      const sizeBuf = Buffer.alloc(4);
      sizeBuf.writeUInt32LE(520);
      const ok = QueryFullProcessImageNameW(hProcess, 0, pathBuf, sizeBuf);
      if (ok) {
        const nameLen = sizeBuf.readUInt32LE(0);
        if (nameLen > 0) {
          const fullPath = readUtf16(pathBuf, nameLen);
          const exeName = fullPath.split('\\').pop();
          return exeName ? exeName.toLowerCase() : null;
        }
      }
    } finally {
      CloseHandle(hProcess);
    }
  }

  return null;
}

/** Convert an opaque koffi pointer to a hex string for JSON. */
function hwndToHex(ptr) {
  try {
    const addr = koffi.address(ptr);
    return '0x' + addr.toString(16);
  } catch {
    return String(ptr);
  }
}

/** Compare two koffi pointers by address. */
function ptrEquals(a, b) {
  try {
    return koffi.address(a) === koffi.address(b);
  } catch {
    return false;
  }
}

/** Synchronous busy-wait (ms). Use sparingly. */
function sleepSync(ms) {
  const end = Date.now() + ms;
  while (Date.now() < end) { /* spin */ }
}

// ---------------------------------------------------------------------------
// Window enumeration
// ---------------------------------------------------------------------------

function enumerateWindows() {
  const windows = [];

  const callback = koffi.register(
    (hwnd, _lParam) => {
      // PID
      const pidBuf = Buffer.alloc(4);
      const threadId = GetWindowThreadProcessId(hwnd, pidBuf);
      const pid = pidBuf.readUInt32LE(0);

      // Visibility
      const isVisible = IsWindowVisible(hwnd);

      // Title (UTF-16)
      const titleBuf = Buffer.alloc(512);
      const titleLen = GetWindowTextW(hwnd, titleBuf, 256);
      const title = titleLen > 0 ? readUtf16(titleBuf, titleLen) : '';

      // Class name (UTF-16)
      const classBuf = Buffer.alloc(512);
      const classLen = GetClassNameW(hwnd, classBuf, 256);
      const className = classLen > 0 ? readUtf16(classBuf, classLen) : '';

      // Rect
      const rectStruct = { left: 0, top: 0, right: 0, bottom: 0 };
      const rectOut = [rectStruct];
      try {
        GetWindowRect(hwnd, rectOut);
      } catch { /* leave zeroed */ }

      // Extended style
      let exStyle = 0n;
      try {
        exStyle = BigInt(GetWindowLongPtrW(hwnd, GWL_EXSTYLE));
      } catch { /* leave 0 */ }

      windows.push({
        hwnd,           // opaque koffi pointer — keep for later Win32 calls
        pid,
        threadId,
        title,
        className,
        isVisible,
        rect: {
          l: rectOut[0].left ?? rectStruct.left,
          t: rectOut[0].top ?? rectStruct.top,
          r: rectOut[0].right ?? rectStruct.right,
          b: rectOut[0].bottom ?? rectStruct.bottom,
        },
        exStyle,
      });
      return true; // continue enumeration
    },
    koffi.pointer(EnumWindowsProc),
  );

  try {
    EnumWindows(callback, 0);
  } finally {
    koffi.unregister(callback);
  }

  return windows;
}

// ---------------------------------------------------------------------------
// Scoring
// ---------------------------------------------------------------------------

function scoreWindow(win) {
  let score = 0;

  // Visible is strongly preferred
  if (win.isVisible) score += 50;

  // Tool windows / no-activate windows are bad candidates
  const isToolWindow = (win.exStyle & BigInt(WS_EX_TOOLWINDOW)) !== 0n;
  const isNoActivate = (win.exStyle & BigInt(WS_EX_NOACTIVATE)) !== 0n;
  if (isToolWindow) score -= 40;
  if (isNoActivate) score -= 30;

  // Size: bigger is better (main game window should be large)
  const width = win.rect.r - win.rect.l;
  const height = win.rect.b - win.rect.t;
  const area = width * height;
  if (area > 500_000) score += 30;
  else if (area > 50_000) score += 15;
  else score -= 10;

  // Unreal Engine window class
  if (win.className === 'UnrealWindow') score += 20;

  // Title containing "satisfactory"
  if (win.title.toLowerCase().includes('satisfactory')) score += 10;

  return score;
}

// ---------------------------------------------------------------------------
// Focus routine
// ---------------------------------------------------------------------------

function attemptFocus(hwnd, targetThreadId) {
  const steps = {};
  const errors = [];

  // 1. Restore if minimised
  try {
    const minimised = IsIconic(hwnd);
    steps.wasMinimised = minimised;
    if (minimised) {
      ShowWindow(hwnd, SW_RESTORE);
      sleepSync(100);
      steps.restored = true;
    }
  } catch (err) {
    errors.push({ step: 'restore', message: err.message });
  }

  // 2. Get foreground thread for AttachThreadInput
  let foregroundThread = 0;
  let attached = false;
  try {
    const fgHwnd = GetForegroundWindow();
    const fgPidBuf = Buffer.alloc(4);
    foregroundThread = GetWindowThreadProcessId(fgHwnd, fgPidBuf);
    const currentThread = GetCurrentThreadId();
    steps.threads = { current: currentThread, foreground: foregroundThread, target: targetThreadId };

    if (foregroundThread !== 0 && foregroundThread !== targetThreadId) {
      attached = AttachThreadInput(currentThread, foregroundThread, true);
      steps.attachedToForeground = attached;
    }
  } catch (err) {
    errors.push({ step: 'threadAttach', message: err.message });
  }

  // 3. SetForegroundWindow + BringWindowToTop + SetFocus
  let fgResult = false;
  try {
    fgResult = SetForegroundWindow(hwnd);
    steps.setForegroundWindow = fgResult;
    BringWindowToTop(hwnd);
    SetFocus(hwnd);
  } catch (err) {
    errors.push({ step: 'setForeground', message: err.message });
  }

  // 4. Detach
  if (attached) {
    try {
      const currentThread = GetCurrentThreadId();
      AttachThreadInput(currentThread, foregroundThread, false);
    } catch { /* best effort */ }
  }

  // 5. Verify
  sleepSync(50);
  let verified = false;
  try {
    const nowFg = GetForegroundWindow();
    verified = ptrEquals(nowFg, hwnd);
    steps.verified = verified;
  } catch (err) {
    errors.push({ step: 'verify', message: err.message });
  }

  // 6. Alt-key retry if verification failed
  if (!verified) {
    try {
      keybd_event(VK_MENU, 0, 0, 0);
      keybd_event(VK_MENU, 0, KEYEVENTF_KEYUP, 0);
      sleepSync(50);
      const retryFg = SetForegroundWindow(hwnd);
      BringWindowToTop(hwnd);
      steps.altKeyRetry = true;
      steps.retrySetForeground = retryFg;

      sleepSync(50);
      const retryNowFg = GetForegroundWindow();
      steps.retryVerified = ptrEquals(retryNowFg, hwnd);
    } catch (err) {
      errors.push({ step: 'altKeyRetry', message: err.message });
    }
  }

  return { steps, errors };
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

/**
 * Enumerate windows, find Satisfactory, and bring it to the foreground.
 * @param {{ dryRun?: boolean }} [options]
 * @returns {FocusResult}
 */
export function focusSatisfactoryWindow(options = {}) {
  const { dryRun = false } = options;

  const result = {
    ok: false,
    selected: {},
    candidates: [],
    windows: [],
    steps: {},
    errors: [],
  };

  try {
    // 1. Enumerate all top-level windows
    const allWindows = enumerateWindows();
    result.steps.totalWindows = allWindows.length;

    // 2. Build PID → processName map (only query each PID once)
    const pidNames = new Map();
    for (const win of allWindows) {
      if (!pidNames.has(win.pid)) {
        pidNames.set(win.pid, getProcessName(win.pid));
      }
    }

    // 3. Identify candidate PIDs
    const candidatePids = new Set();
    for (const [pid, name] of pidNames) {
      if (name && CANDIDATE_PROCESS_NAMES.includes(name)) {
        candidatePids.add(pid);
        result.candidates.push({ pid, processName: name });
      }
    }

    if (candidatePids.size === 0) {
      result.errors.push({
        step: 'findProcess',
        message: `No Satisfactory process found. Looked for: ${CANDIDATE_PROCESS_NAMES.join(', ')}`,
      });
      return result;
    }

    // 4. Filter to candidate windows, score, sort
    const matchingWindows = allWindows
      .filter((w) => candidatePids.has(w.pid))
      .map((w) => ({
        ...w,
        processName: pidNames.get(w.pid),
        score: scoreWindow(w),
      }))
      .sort((a, b) => b.score - a.score);

    result.windows = matchingWindows.map((w) => ({
      hwnd: hwndToHex(w.hwnd),
      pid: w.pid,
      title: w.title,
      className: w.className,
      isVisible: w.isVisible,
      rect: w.rect,
      exStyle: '0x' + w.exStyle.toString(16),
      score: w.score,
    }));

    // 5. Select the best window
    const best = matchingWindows[0];
    if (!best) {
      result.errors.push({ step: 'selectWindow', message: 'No windows matched candidate PIDs' });
      return result;
    }

    result.selected = {
      pid: best.pid,
      hwnd: hwndToHex(best.hwnd),
      processName: best.processName,
    };

    // 6. Focus (unless dry run)
    if (dryRun) {
      result.steps.dryRun = true;
      result.ok = true;
      return result;
    }

    const focusResult = attemptFocus(best.hwnd, best.threadId);
    result.steps = { ...result.steps, ...focusResult.steps };
    result.errors.push(...focusResult.errors);

    // Determine ok: prefer verification, but accept SetForegroundWindow success
    if (focusResult.steps.verified || focusResult.steps.retryVerified) {
      result.ok = true;
    } else if (focusResult.steps.setForegroundWindow || focusResult.steps.retrySetForeground) {
      result.ok = true;
      result.steps.note = 'Verification inconclusive but SetForegroundWindow returned true';
    }
  } catch (err) {
    result.errors.push({ step: 'unexpected', message: err.message });
  }

  return result;
}
