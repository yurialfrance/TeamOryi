import { exportBackupString, importBackupString } from '../src/store/backup'

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error('❌ Assertion failed:', msg)
    process.exit(1)
  }
}

console.log('Testing Defensive Backup & Cryptographic Integrity...')

async function run() {
  // 1. Export valid backup
  const exported = await exportBackupString()
  console.log('Export length:', exported.length)
  const parsed = JSON.parse(exported)
  assert(parsed.app === 'sipnayan', 'Backup app must be sipnayan')
  assert(parsed.version === 1, 'Backup version must be 1')
  assert(typeof parsed.checksum === 'string' && parsed.checksum.length >= 16, 'Should have cryptographic checksum')
  console.log('Export verified, checksum:', parsed.checksum)

  // 2. Import valid backup
  const importValid = await importBackupString(exported)
  console.log('Valid import result:', importValid)
  assert(importValid.ok, 'Valid backup should import successfully')

  // 3. Tampered data rejection
  const tampered = JSON.parse(exported)
  tampered.data.xp = 999999 // altered without updating checksum
  const importTampered = await importBackupString(JSON.stringify(tampered))
  console.log('Tampered import result:', importTampered)
  assert(!importTampered.ok, 'Tampered data must be rejected by checksum check')

  // 4. Prototype pollution / dangerous payload rejection
  const evilPayload = JSON.stringify({
    app: 'sipnayan',
    version: 1,
    checksum: 'fake',
    __proto__: { admin: true },
    data: { name: 'Hacker', xp: 100 },
  })
  const importEvil = await importBackupString(evilPayload)
  console.log('Evil payload result:', importEvil)
  assert(!importEvil.ok, 'Prototype pollution payload must be rejected')

  console.log('✅ Defensive Backup & Cryptographic Integrity tests passed!')
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
