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

try {
  const mod = await import('./lib/win32-focus.js');
  focusSatisfactoryWindow = mod.focusSatisfactoryWindow;
  console.log('[win32-focus] Koffi FFI loaded successfully');
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

  // Step 1: Focus the game window via FFI (fast, reliable)
  if (focusSatisfactoryWindow) {
    const focusResult = focusSatisfactoryWindow();
    console.log(`[Teleport] FFI focus ok=${focusResult.ok}`);
    if (!focusResult.ok) {
      return res.status(500).json({
        error: 'Could not focus Satisfactory window',
        details: focusResult.errors.map(e => e.message).join('; '),
      });
    }
  }

  // Step 2: Send keystrokes via PowerShell SendKeys (only the typing part)
  const safeCommand = command.replace(/'/g, "''");

  // If we used FFI focus, we just need to send keys — no need to find/focus the window again
  const psScript = focusSatisfactoryWindow
    ? `
try {
    Start-Sleep -Milliseconds 150
    $wshell = New-Object -ComObject wscript.shell
    $wshell.SendKeys('{ENTER}')
    Start-Sleep -Milliseconds 50
    $wshell.SendKeys('${safeCommand}')
    Start-Sleep -Milliseconds 50
    $wshell.SendKeys('{ENTER}')
    Write-Output 'Command sent successfully'
} catch {
    Write-Error $_.Exception.Message
    exit 1
}
`
    : `
${PS_PREAMBLE}
try {
    $proc = Get-Process | Where-Object { $_.MainWindowTitle -like '*Satisfactory*' } | Select-Object -First 1
    if ($proc -and $proc.MainWindowHandle -ne [IntPtr]::Zero) {
        ForceForeground $proc.MainWindowHandle
        Start-Sleep -Milliseconds 150
    }
    $wshell = New-Object -ComObject wscript.shell
    $wshell.SendKeys('{ENTER}')
    Start-Sleep -Milliseconds 50
    $wshell.SendKeys('${safeCommand}')
    Start-Sleep -Milliseconds 50
    $wshell.SendKeys('{ENTER}')
    Write-Output 'Command sent successfully'
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
      res.json({ success: true, output: stdout });
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
