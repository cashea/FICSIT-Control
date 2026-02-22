import express from 'express';
import { exec } from 'child_process';
import cors from 'cors';

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

const PORT = 3001;
const HOST = '0.0.0.0';

// ---------------------------------------------------------------------------
// Koffi FFI — loaded dynamically so the server still starts if koffi missing
// ---------------------------------------------------------------------------
let focusSatisfactoryWindow = null;
let sendScanKeyPress = null;
let sendCtrlV = null;
let setClipboardText = null;
let sleepSync = null;
let SC_ENTER = null;

try {
  const mod = await import('./lib/win32-focus.js');
  focusSatisfactoryWindow = mod.focusSatisfactoryWindow;
  sendScanKeyPress = mod.sendScanKeyPress;
  sendCtrlV = mod.sendCtrlV;
  setClipboardText = mod.setClipboardText;
  sleepSync = mod.sleepSync;
  SC_ENTER = mod.SC_ENTER;
  console.log('[win32-focus] Koffi FFI loaded successfully (focus + keyboard + clipboard)');
} catch (err) {
  console.warn('[win32-focus] Koffi not available — focus endpoint will use PowerShell fallback');
  console.warn(`  Error: ${err.message}`);
  console.warn('  Install with: npm install koffi');
}

// ---------------------------------------------------------------------------
// Reusable PowerShell preamble (kept for /teleport and as fallback for focus)
// ---------------------------------------------------------------------------
const PS_PREAMBLE = `
Add-Type @'
using System;
using System.Runtime.InteropServices;
public class Win32 {
    [DllImport("user32.dll", SetLastError = true)]
    public static extern IntPtr FindWindow(string lpClassName, string lpWindowName);

    [DllImport("user32.dll")]
    [return: MarshalAs(UnmanagedType.Bool)]
    public static extern bool SetForegroundWindow(IntPtr hWnd);

    [DllImport("user32.dll")]
    [return: MarshalAs(UnmanagedType.Bool)]
    public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);

    [DllImport("user32.dll")]
    [return: MarshalAs(UnmanagedType.Bool)]
    public static extern bool BringWindowToTop(IntPtr hWnd);

    [DllImport("user32.dll")]
    [return: MarshalAs(UnmanagedType.Bool)]
    public static extern bool IsIconic(IntPtr hWnd);

    [DllImport("user32.dll")]
    public static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, UIntPtr dwExtraInfo);

    public const int SW_RESTORE = 9;
    public const int SW_SHOW = 5;
    public const byte VK_MENU = 0x12;
    public const uint KEYEVENTF_KEYUP = 0x0002;
}
'@

function ForceForeground([IntPtr]$hwnd) {
    if ([Win32]::IsIconic($hwnd)) {
        [Win32]::ShowWindow($hwnd, [Win32]::SW_RESTORE) | Out-Null
    }
    [Win32]::keybd_event([Win32]::VK_MENU, 0, 0, [UIntPtr]::Zero)
    [Win32]::keybd_event([Win32]::VK_MENU, 0, [Win32]::KEYEVENTF_KEYUP, [UIntPtr]::Zero)
    Start-Sleep -Milliseconds 50
    [Win32]::SetForegroundWindow($hwnd) | Out-Null
    [Win32]::BringWindowToTop($hwnd) | Out-Null
    [Win32]::ShowWindow($hwnd, [Win32]::SW_SHOW) | Out-Null
}
`;

// ---------------------------------------------------------------------------
// GET /status
// ---------------------------------------------------------------------------
app.get('/status', (req, res) => {
  res.json({ status: 'running', timestamp: new Date().toISOString() });
});

// ---------------------------------------------------------------------------
// GET /window/focus/capabilities
// ---------------------------------------------------------------------------
app.get('/window/focus/capabilities', (_req, res) => {
  res.json({
    ffi: !!focusSatisfactoryWindow,
    platform: process.platform,
  });
});

// ---------------------------------------------------------------------------
// POST /window/focus/satisfactory — Bring game window to foreground
// ---------------------------------------------------------------------------
app.post('/window/focus/satisfactory', (req, res) => {
  console.log(`[${new Date().toISOString()}] Focus Satisfactory requested`);

  // ---- FFI path (fast, ~30ms) ----
  if (focusSatisfactoryWindow) {
    try {
      const result = focusSatisfactoryWindow();
      console.log(`[Focus] ok=${result.ok} selected=${result.selected.hwnd ?? 'none'}`);
      return res.json(result);
    } catch (err) {
      console.error(`[Focus FFI Error] ${err.message}`);
      return res.status(500).json({
        ok: false,
        selected: {},
        candidates: [],
        windows: [],
        steps: {},
        errors: [{ step: 'ffi', message: err.message }],
      });
    }
  }

  // ---- PowerShell fallback (slower, ~400ms) ----
  console.log('[Focus] Using PowerShell fallback');
  const psScript = `
${PS_PREAMBLE}
try {
    $hwnd = [Win32]::FindWindow([NullString]::Value, 'Satisfactory')
    if ($hwnd -eq [IntPtr]::Zero) {
        $proc = Get-Process | Where-Object { $_.MainWindowTitle -like '*Satisfactory*' } | Select-Object -First 1
        if ($proc -and $proc.MainWindowHandle -ne [IntPtr]::Zero) {
            $hwnd = $proc.MainWindowHandle
        }
    }
    if ($hwnd -eq [IntPtr]::Zero) {
        Write-Output '{"ok":false,"errors":[{"step":"ps-find","message":"Window not found"}]}'
        exit 0
    }
    ForceForeground $hwnd
    Write-Output '{"ok":true}'
} catch {
    Write-Output ('{"ok":false,"errors":[{"step":"ps-focus","message":"' + $_.Exception.Message.Replace('"','\\"') + '"}]}')
}
`;

  exec(
    `powershell -NoProfile -ExecutionPolicy Bypass -Command "${psScript}"`,
    { timeout: 5000 },
    (error, stdout, stderr) => {
      if (error) {
        console.error(`[Focus PS Error] ${error.message}`);
        return res.json({
          ok: false,
          selected: {},
          candidates: [],
          windows: [],
          steps: { method: 'powershell' },
          errors: [{ step: 'ps-exec', message: stderr || error.message }],
        });
      }
      try {
        const parsed = JSON.parse(stdout.trim());
        // Fill in missing fields for schema compliance
        return res.json({
          ok: parsed.ok ?? false,
          selected: parsed.selected ?? {},
          candidates: parsed.candidates ?? [],
          windows: parsed.windows ?? [],
          steps: { method: 'powershell' },
          errors: parsed.errors ?? [],
        });
      } catch {
        return res.json({
          ok: false,
          selected: {},
          candidates: [],
          windows: [],
          steps: { method: 'powershell', rawOutput: stdout.trim() },
          errors: [{ step: 'ps-parse', message: 'Could not parse PowerShell output' }],
        });
      }
    }
  );
});

// ---------------------------------------------------------------------------
// POST /teleport — Focus game window then send console command
// ---------------------------------------------------------------------------
app.post('/teleport', (req, res) => {
  const { command } = req.body;

  if (!command) {
    return res.status(400).json({ error: 'Command is required' });
  }

  console.log(`[${new Date().toISOString()}] Received teleport command: ${command}`);

  // ---- FFI path: focus + clipboard + keyboard all from the same process ----
  if (focusSatisfactoryWindow && sendScanKeyPress && sendCtrlV && setClipboardText && sleepSync) {
    try {
      // 1. Set clipboard BEFORE focusing (so it's ready when we paste)
      const clipOk = setClipboardText(command);
      console.log(`[Teleport] Clipboard set: ${clipOk}`);

      // 2. Focus game window
      const focusResult = focusSatisfactoryWindow();
      console.log(`[Teleport] FFI focus ok=${focusResult.ok}`);
      if (!focusResult.ok) {
        return res.status(500).json({
          error: 'Could not focus Satisfactory window',
          details: focusResult.errors.map(e => e.message).join('; '),
        });
      }

      // 3. Wait for window to fully activate
      sleepSync(300);

      // 4. Open chat (Enter), paste (Ctrl+V), send (Enter)
      sendScanKeyPress(SC_ENTER);
      sleepSync(200);
      sendCtrlV();
      sleepSync(150);
      sendScanKeyPress(SC_ENTER);

      console.log(`[Teleport] FFI keyboard sequence sent`);
      return res.json({ success: true, method: 'ffi', output: 'Command sent via FFI' });
    } catch (err) {
      console.error(`[Teleport FFI Error] ${err.message}`);
      // Fall through to PowerShell fallback
    }
  }

  // ---- PowerShell fallback (when koffi is not available) ----
  console.log('[Teleport] Using PowerShell fallback');
  const safeCommand = command.replace(/'/g, "''");

  const sendInputBlock = `
Add-Type @'
using System;
using System.Runtime.InteropServices;

public class SendInputHelper {
    [StructLayout(LayoutKind.Sequential)]
    public struct INPUT {
        public uint type;
        public INPUTUNION U;
    }

    [StructLayout(LayoutKind.Explicit)]
    public struct INPUTUNION {
        [FieldOffset(0)] public KEYBDINPUT ki;
    }

    [StructLayout(LayoutKind.Sequential)]
    public struct KEYBDINPUT {
        public ushort wVk;
        public ushort wScan;
        public uint dwFlags;
        public uint time;
        public IntPtr dwExtraInfo;
    }

    [DllImport("user32.dll", SetLastError = true)]
    public static extern uint SendInput(uint nInputs, INPUT[] pInputs, int cbSize);

    public const uint INPUT_KEYBOARD = 1;
    public const uint KEYEVENTF_SCANCODE = 0x0008;
    public const uint KEYEVENTF_KEYUP = 0x0002;

    public const ushort SC_ENTER  = 0x1C;
    public const ushort SC_LCTRL  = 0x1D;
    public const ushort SC_V      = 0x2F;

    public static void ScanKeyPress(ushort scanCode) {
        INPUT[] inputs = new INPUT[2];
        inputs[0].type = INPUT_KEYBOARD;
        inputs[0].U.ki.wScan = scanCode;
        inputs[0].U.ki.dwFlags = KEYEVENTF_SCANCODE;
        inputs[1].type = INPUT_KEYBOARD;
        inputs[1].U.ki.wScan = scanCode;
        inputs[1].U.ki.dwFlags = KEYEVENTF_SCANCODE | KEYEVENTF_KEYUP;
        SendInput(2, inputs, Marshal.SizeOf(typeof(INPUT)));
    }

    public static void ScanCtrlV() {
        INPUT[] inputs = new INPUT[4];
        inputs[0].type = INPUT_KEYBOARD;
        inputs[0].U.ki.wScan = SC_LCTRL;
        inputs[0].U.ki.dwFlags = KEYEVENTF_SCANCODE;
        inputs[1].type = INPUT_KEYBOARD;
        inputs[1].U.ki.wScan = SC_V;
        inputs[1].U.ki.dwFlags = KEYEVENTF_SCANCODE;
        inputs[2].type = INPUT_KEYBOARD;
        inputs[2].U.ki.wScan = SC_V;
        inputs[2].U.ki.dwFlags = KEYEVENTF_SCANCODE | KEYEVENTF_KEYUP;
        inputs[3].type = INPUT_KEYBOARD;
        inputs[3].U.ki.wScan = SC_LCTRL;
        inputs[3].U.ki.dwFlags = KEYEVENTF_SCANCODE | KEYEVENTF_KEYUP;
        SendInput(4, inputs, Marshal.SizeOf(typeof(INPUT)));
    }
}
'@

Add-Type -AssemblyName System.Windows.Forms
[System.Windows.Forms.Clipboard]::SetText('${safeCommand}')
Start-Sleep -Milliseconds 150
[SendInputHelper]::ScanKeyPress([SendInputHelper]::SC_ENTER)
Start-Sleep -Milliseconds 200
[SendInputHelper]::ScanCtrlV()
Start-Sleep -Milliseconds 150
[SendInputHelper]::ScanKeyPress([SendInputHelper]::SC_ENTER)
Write-Output 'Command sent successfully'
`;

  const psScript = `
${PS_PREAMBLE}
try {
    $proc = Get-Process | Where-Object { $_.MainWindowTitle -like '*Satisfactory*' } | Select-Object -First 1
    if ($proc -and $proc.MainWindowHandle -ne [IntPtr]::Zero) {
        ForceForeground $proc.MainWindowHandle
        Start-Sleep -Milliseconds 250
    }
    ${sendInputBlock}
} catch {
    Write-Error $_.Exception.Message
    exit 1
}
`;

  exec(
    `powershell -NoProfile -ExecutionPolicy Bypass -Command "${psScript}"`,
    { timeout: 5000 },
    (error, stdout, stderr) => {
      if (error) {
        console.error(`[Error] Exec failed: ${error.message}`);
        console.error(`[Stderr] ${stderr}`);
        return res.status(500).json({
          error: 'Failed to execute command',
          details: stderr || stdout,
        });
      }
      console.log(`[Success] Output: ${stdout.trim()}`);
      res.json({ success: true, method: 'powershell', output: stdout });
    }
  );
});

// ---------------------------------------------------------------------------
// POST /clipboard — set system clipboard text (used for return-location after
// smart teleport; called separately so the game has time to read the paste)
// ---------------------------------------------------------------------------
app.post('/clipboard', (req, res) => {
  const { text } = req.body;
  if (!text) {
    return res.status(400).json({ error: 'text is required' });
  }

  if (setClipboardText) {
    const ok = setClipboardText(text);
    console.log(`[Clipboard] Set via FFI: ok=${ok} text=${text}`);
    return res.json({ success: ok, method: 'ffi' });
  }

  // PowerShell fallback
  const safeText = text.replace(/'/g, "''");
  exec(
    `powershell -NoProfile -ExecutionPolicy Bypass -Command "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.Clipboard]::SetText('${safeText}')"`,
    { timeout: 3000 },
    (error) => {
      if (error) {
        console.error(`[Clipboard PS Error] ${error.message}`);
        return res.status(500).json({ error: 'Failed to set clipboard' });
      }
      console.log(`[Clipboard] Set via PowerShell: text=${text}`);
      res.json({ success: true, method: 'powershell' });
    }
  );
});

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------
app.listen(PORT, HOST, () => {
  console.log(`Bridge server running on http://localhost:${PORT}`);
  console.log(`Accessible at http://127.0.0.1:${PORT}`);
  console.log(`FFI focus: ${focusSatisfactoryWindow ? 'ENABLED (koffi)' : 'DISABLED (PowerShell fallback)'}`);
  console.log('Endpoints:');
  console.log('  GET  /status');
  console.log('  GET  /window/focus/capabilities');
  console.log('  POST /window/focus/satisfactory');
  console.log('  POST /teleport');
});
