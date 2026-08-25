#!/usr/bin/env node
'use strict'

const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const { execFileSync, spawnSync } = require('child_process')

const repoRoot = path.resolve(__dirname, '..')
const moduleDist = path.resolve(process.env.AIRGAP_KAIZOU_SOLANA_MODULE_DIST || path.join(repoRoot, '..', 'airgap-solana-module', 'dist'))
const legalFiles = ['LICENSE', 'THIRD_PARTY_NOTICES.md', 'THIRD_PARTY_DEPENDENCIES.md']
const requiredFiles = ['manifest.json', 'airgap-solana-module.bundle.js', 'module.sig', ...legalFiles]
const staticRelative = path.join('src', 'assets', 'protocol_modules', 'airgap-solana-module')
const releaseContract = JSON.parse(fs.readFileSync(path.join(repoRoot, 'contratos', 'airgap-vault-kaizou-solana-release.schema.json'), 'utf8'))
const releaseProperties = releaseContract.properties.release.properties
const expectedKaizouVersion = releaseProperties.kaizouVersion.const
const expectedSolanaModuleVersion = releaseProperties.solanaModuleVersion.const

function fail(message) {
  console.error(`FAIL: ${message}`)
  process.exit(1)
}

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')
}

function verifyModule() {
  for (const name of requiredFiles) {
    const file = path.join(moduleDist, name)
    if (!fs.existsSync(file) || !fs.statSync(file).isFile()) fail(`missing Solana module artifact: ${file}`)
  }
  const manifestPath = path.join(moduleDist, 'manifest.json')
  const manifestBytes = fs.readFileSync(manifestPath)
  const manifest = JSON.parse(manifestBytes.toString('utf8'))
  if (manifest.name !== 'airgap-solana-module') fail(`unexpected module name: ${manifest.name}`)
  if (manifest.version !== expectedSolanaModuleVersion) fail(`unexpected Solana module version: ${manifest.version}; expected ${expectedSolanaModuleVersion}`)
  if (!Array.isArray(manifest.include) || manifest.include.length !== 1 || manifest.include[0] !== 'airgap-solana-module.bundle.js') {
    fail(`unexpected module include list: ${JSON.stringify(manifest.include)}`)
  }
  if (!/^[0-9a-fA-F]{64}$/.test(manifest.publicKey || '')) fail('module manifest publicKey must be 32-byte hex')
  const signature = fs.readFileSync(path.join(moduleDist, 'module.sig'))
  if (signature.length !== 64) fail(`module signature must be 64 bytes, got ${signature.length}`)
  if (!manifest.legal || !manifest.legal.files || typeof manifest.legal.files !== 'object') fail('module manifest must contain signed legal file hashes')
  for (const name of legalFiles) {
    const expected = manifest.legal.files[name]
    if (!/^[0-9a-f]{64}$/.test(expected || '')) fail(`module manifest missing SHA-256 for ${name}`)
    const actual = sha256(path.join(moduleDist, name))
    if (actual !== expected) fail(`module legal file hash mismatch for ${name}: ${actual} != ${expected}`)
  }
  const message = Buffer.concat([...manifest.include.map((name) => fs.readFileSync(path.join(moduleDist, name))), manifestBytes])
  const spki = Buffer.concat([Buffer.from('302a300506032b6570032100', 'hex'), Buffer.from(manifest.publicKey, 'hex')])
  const publicKey = crypto.createPublicKey({ key: spki, format: 'der', type: 'spki' })
  if (!crypto.verify(null, message, publicKey, signature)) fail('Solana module Ed25519 signature verification failed')
  console.log(`PASS: module signature; version=${manifest.version}; bundle_sha256=${sha256(path.join(moduleDist, manifest.include[0]))}`)
  return manifest
}

function run(command, args, cwd, env = process.env) {
  console.log(`RUN: ${command} ${args.join(' ')}`)
  const result = spawnSync(command, args, { cwd, env, stdio: 'inherit' })
  if (result.status !== 0) fail(`${command} exited ${result.status}`)
}

const kaizouPackage = JSON.parse(fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8'))
if (kaizouPackage.version !== expectedKaizouVersion) fail(`unexpected Kaizou package version: ${kaizouPackage.version}; expected ${expectedKaizouVersion}`)
const manifest = verifyModule()
if (process.argv.includes('--verify-only')) {
  console.log(`PASS: release contract verified; kaizou=${expectedKaizouVersion}; solana_module=${expectedSolanaModuleVersion}; static_path=${staticRelative.replaceAll(path.sep, '/')}`)
  process.exit(0)
}

if (!process.argv.includes('--build')) fail('use --verify-only or --build')
const status = execFileSync('git', ['status', '--porcelain'], { cwd: repoRoot, encoding: 'utf8' })
if (status.trim() !== '') fail('release build requires a clean committed Kaizou tree')

const stagingRoot = path.resolve(process.env.AIRGAP_KAIZOU_RELEASE_STAGING || '/mnt/e/airgap-vault-kaizou-workspace/builds/airgap-vault-kaizou-release-staging')
fs.rmSync(stagingRoot, { recursive: true, force: true })
fs.mkdirSync(stagingRoot, { recursive: true })
const archive = path.join(stagingRoot, 'airgap-vault-kaizou-source.tar')
execFileSync('git', ['archive', '--format=tar', '-o', archive, 'HEAD'], { cwd: repoRoot })
const sourceRoot = path.join(stagingRoot, 'source')
fs.mkdirSync(sourceRoot)
run('tar', ['-xf', archive, '-C', sourceRoot], repoRoot)
fs.rmSync(archive)

const staticDir = path.join(sourceRoot, staticRelative)
fs.mkdirSync(staticDir, { recursive: true })
for (const name of requiredFiles) fs.copyFileSync(path.join(moduleDist, name), path.join(staticDir, name))
const originalNodeModules = path.join(repoRoot, 'node_modules')
if (!fs.existsSync(originalNodeModules)) fail('Kaizou node_modules missing')
fs.symlinkSync(originalNodeModules, path.join(sourceRoot, 'node_modules'), 'dir')

const env = { ...process.env }
run('yarn', ['run', 'postinstall'], sourceRoot, env)
run('node', ['node_modules/@ionic/cli/bin/ionic', 'build', '--prod'], sourceRoot, env)
run('node', ['node_modules/@capacitor/cli/bin/capacitor', 'sync', 'android'], sourceRoot, env)

for (const base of [path.join(sourceRoot, 'www', 'assets', 'protocol_modules', 'airgap-solana-module'), path.join(sourceRoot, 'android', 'app', 'src', 'main', 'assets', 'public', 'assets', 'protocol_modules', 'airgap-solana-module')]) {
  for (const name of requiredFiles) if (!fs.existsSync(path.join(base, name))) fail(`static module missing after build: ${path.join(base, name)}`)
}

const androidHome = env.ANDROID_HOME || env.ANDROID_SDK_ROOT || '/mnt/e/airgap-vault-kaizou-workspace/android-sdk'
fs.writeFileSync(path.join(sourceRoot, 'android', 'local.properties'), `sdk.dir=${androidHome}\n`)
const gradleEnv = { ...env, ANDROID_HOME: androidHome, ANDROID_SDK_ROOT: androidHome, GRADLE_USER_HOME: env.GRADLE_USER_HOME || '/mnt/e/airgap-vault-kaizou-workspace/gradle-home' }
run(path.join(sourceRoot, 'android', 'gradlew'), ['--project-dir', path.join(sourceRoot, 'android'), 'assembleDebug'], sourceRoot, gradleEnv)
const apk = path.join(sourceRoot, 'android', 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk')
if (!fs.existsSync(apk)) fail('APK not generated')
const zipCheck = spawnSync('python3', ['-c', 'import sys,zipfile; p=sys.argv[1]; z=zipfile.ZipFile(p); bad=z.testzip(); print(chr(10).join(z.namelist())); sys.exit(0 if bad is None else 2)', apk], { encoding: 'utf8' })
if (zipCheck.status !== 0) fail(`APK ZIP integrity check failed: ${zipCheck.stderr || zipCheck.stdout}`)
const listing = zipCheck.stdout
for (const name of requiredFiles) {
  const expected = `assets/public/assets/protocol_modules/airgap-solana-module/${name}`
  if (!listing.split(/\r?\n/).includes(expected)) fail(`APK missing ${expected}`)
}
console.log(`PASS: Kaizou APK contains static Solana module ${manifest.version}`)
console.log(`APK=${apk}`)
console.log(`APK_SHA256=${sha256(apk)}`)
