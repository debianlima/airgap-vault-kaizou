#!/usr/bin/env node
'use strict'

const { spawn, spawnSync } = require('child_process')
const fs = require('fs')
const os = require('os')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')
const NG = path.join(ROOT, 'node_modules', '@angular', 'cli', 'bin', 'ng')
const KARMA = path.join(ROOT, 'scripts', 'airgap-vault-kaizou-karma.conf.js')
const WIN_CHROME_WSL = '/mnt/c/Program Files/Google/Chrome/Application/chrome.exe'
function resolveLinuxChrome() {
  try {
    const puppeteer = require(path.join(ROOT, 'node_modules', 'puppeteer'))
    const executable = puppeteer.executablePath()
    if (executable && fs.existsSync(executable)) return executable
  } catch {}

  const cacheRoot = path.join(os.homedir(), '.cache', 'puppeteer', 'chrome')
  if (!fs.existsSync(cacheRoot)) return undefined
  const candidates = fs
    .readdirSync(cacheRoot)
    .sort()
    .reverse()
    .map((version) => path.join(cacheRoot, version, 'chrome-linux64', 'chrome'))
    .filter((candidate) => fs.existsSync(candidate))
  return candidates[0]
}

const PUPPETEER_CHROME = resolveLinuxChrome()
const PROFILE_ROOT = '/mnt/e/airgap-vault-kaizou-workspace/cache'
const DEFAULT_TIMEOUT_MS = 180000

const ALL = [
  ['src/app/services/solflare-keystone/solflare-keystone.service.spec.ts', 6],
  ['src/app/services/iac/iac.service.spec.ts', 3],
  ['src/app/pages/account-address/account-address.page.spec.ts', 2],
  ['src/app/pages/account-share/account-share.page.spec.ts', 3],
  ['src/app/services/interaction/interaction.service.spec.ts', 1],
  ['src/app/pages/transaction-signed/transaction-signed.page.spec.ts', 1]
]

function parseArgs(argv) {
  const out = { all: false, suite: false, include: undefined, expected: undefined }
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--all') out.all = true
    else if (arg === '--suite') out.suite = true
    else if (arg === '--include') out.include = argv[++i]
    else if (arg === '--expected') out.expected = Number(argv[++i])
    else throw new Error(`unknown argument: ${arg}`)
  }
  if (!out.all && !out.suite && (!out.include || !Number.isInteger(out.expected) || out.expected < 1)) {
    throw new Error('usage: --all OR --suite OR --expected N --include path/to/spec.ts')
  }
  if ([out.all, out.suite, Boolean(out.include)].filter(Boolean).length !== 1) throw new Error('choose exactly one mode: --all, --suite, or --include')
  return out
}

function shellQuote(value) {
  return `'${String(value).replace(/'/g, `'\\''`)}'`
}

function makeChromeWrapper(tag) {
  if (fs.existsSync(PUPPETEER_CHROME)) return undefined
  if (!fs.existsSync(WIN_CHROME_WSL)) return undefined
  fs.mkdirSync(PROFILE_ROOT, { recursive: true })
  const profileWsl = path.join(PROFILE_ROOT, `airgap-vault-kaizou-karma-${tag}`)
  fs.mkdirSync(profileWsl, { recursive: true })
  const wrapper = path.join(os.tmpdir(), `airgap-vault-kaizou-karma-chrome-${tag}.sh`)
  const body = `#!/usr/bin/env bash\nset -e\nprofile=${shellQuote(profileWsl)}\nwinprofile=$(wslpath -w "$profile")\nargs=()\nfor a in "$@"; do\n  case "$a" in --user-data-dir=*) ;; *) args+=("$a") ;; esac\ndone\nexec ${shellQuote(WIN_CHROME_WSL)} "${'${args[@]}'}" "--user-data-dir=$winprofile"\n`
  fs.writeFileSync(wrapper, body, { mode: 0o700 })
  return { wrapper, profileWsl, marker: `airgap-vault-kaizou-karma-${tag}` }
}

function runPowerShellEncoded(script) {
  const encoded = Buffer.from(script, 'utf16le').toString('base64')
  return spawnSync('powershell.exe', ['-NoProfile', '-EncodedCommand', encoded], { stdio: 'ignore' })
}

function killWindowsChrome(marker) {
  const needle = marker || 'airgap-vault-kaizou-karma-'
  const escaped = needle.replace(/'/g, "''")
  const ps = `$ErrorActionPreference='SilentlyContinue'; $deadline=(Get-Date).AddSeconds(4); do { $ps=@(Get-CimInstance Win32_Process | Where-Object { $_.Name -match '^chrome(.exe)?$' -and $_.CommandLine -like '*${escaped}*' }); foreach($p in $ps){ Stop-Process -Id $p.ProcessId -Force -ErrorAction SilentlyContinue }; if($ps.Count -eq 0){ break }; Start-Sleep -Milliseconds 250 } while((Get-Date) -lt $deadline)`
  runPowerShellEncoded(ps)
}

function terminateProcessGroup(child) {
  if (!child || !child.pid) return
  try { process.kill(-child.pid, 'SIGTERM') } catch (_) {}
  spawnSync('sleep', ['1'], { stdio: 'ignore' })
  try { process.kill(-child.pid, 'SIGKILL') } catch (_) {}
  spawnSync('sleep', ['0.25'], { stdio: 'ignore' })
}

function getFreeKarmaPort() {
  const result = spawnSync('python3', ['-c', 'import socket; s=socket.socket(); s.bind(("127.0.0.1",0)); print(s.getsockname()[1]); s.close()'], { encoding: 'utf8' })
  if (result.status !== 0) throw new Error('could not allocate a free Karma port')
  const port = Number(String(result.stdout).trim())
  if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error(`invalid Karma port: ${result.stdout}`)
  return port
}

function runOne(include, expected, suite = false) {
  return new Promise((resolve) => {
    killWindowsChrome()
    const tag = `${process.pid}-${Date.now()}-${Math.random().toString(16).slice(2)}`
    const chrome = makeChromeWrapper(tag)
    const env = { ...process.env }
    if (chrome) env.CHROME_BIN = chrome.wrapper
    else if (fs.existsSync(PUPPETEER_CHROME)) env.CHROME_BIN = PUPPETEER_CHROME
    env.NODE_PATH = path.join(ROOT, 'node_modules')
    const karmaPort = getFreeKarmaPort()
    env.AIRGAP_KAIZOU_KARMA_PORT = String(karmaPort)

    const args = [NG, 'test', '--watch=false', '--progress=false', '--karma-config', KARMA]
    if (include) args.push('--include', include)
    console.log(suite ? `GATE START suite=full port=${karmaPort}` : `GATE START include=${include} expected=${expected} port=${karmaPort}`)
    const child = spawn(process.execPath, args, { cwd: ROOT, env, detached: true, stdio: ['ignore', 'pipe', 'pipe'] })

    let output = ''
    let finished = false
    let timer

    const cleanup = () => {
      clearTimeout(timer)
      terminateProcessGroup(child)
      killWindowsChrome(chrome && chrome.marker)
      if (chrome) {
        try { fs.rmSync(chrome.wrapper, { force: true }) } catch (_) {}
      }
    }

    const finish = (ok, reason) => {
      if (finished) return
      finished = true
      cleanup()
      console.log(`${ok ? 'PASS' : 'FAIL'}: ${reason}`)
      resolve(ok)
    }

    const inspect = () => {
      const failed = /TOTAL:\s*\d+\s+FAILED/i.test(output) || /Executed\s+\d+\s+of\s+\d+[^\n]*FAILED/i.test(output)
      if (failed) return finish(false, `${include}: Karma reported FAILED`)
      const matches = [...output.matchAll(/TOTAL:\s*(\d+)\s+SUCCESS/gi)]
      if (matches.length) {
        const actual = Number(matches[matches.length - 1][1])
        if (suite) {
          if (actual < 1) return finish(false, `full suite: expected at least 1 SUCCESS, got ${actual}`)
          return finish(true, `full suite: TOTAL ${actual} SUCCESS`)
        }
        if (actual !== expected) return finish(false, `${include}: expected ${expected} SUCCESS, got ${actual}`)
        return finish(true, `${include}: TOTAL ${actual} SUCCESS`)
      }
    }

    const onData = (chunk) => {
      const text = chunk.toString()
      output += text
      process.stdout.write(text)
      inspect()
    }
    child.stdout.on('data', onData)
    child.stderr.on('data', onData)
    child.on('error', (error) => finish(false, `${include}: spawn error: ${error.message}`))
    child.on('exit', (code, signal) => {
      if (finished) return
      inspect()
      if (!finished) finish(false, `${include}: process exited code=${code} signal=${signal} before expected TOTAL SUCCESS`)
    })
    timer = setTimeout(() => finish(false, `${suite ? 'full suite' : include}: timeout before expected TOTAL SUCCESS`), suite ? 280000 : DEFAULT_TIMEOUT_MS)
  })
}

async function main() {
  let options
  try { options = parseArgs(process.argv.slice(2)) } catch (error) { console.error(`FAIL: ${error.message}`); process.exit(2) }
  if (options.suite) {
    const ok = await runOne(undefined, undefined, true)
    if (!ok) process.exit(1)
    console.log('PASS: karma gate completed full upstream suite')
    return
  }
  const jobs = options.all ? ALL : [[options.include, options.expected]]
  for (const [include, expected] of jobs) {
    const ok = await runOne(include, expected, false)
    if (!ok) process.exit(1)
  }
  console.log(`PASS: karma gate completed ${jobs.length} spec file(s)`)
}

main().catch((error) => { console.error(`FAIL: ${error.stack || error}`); process.exit(1) })
