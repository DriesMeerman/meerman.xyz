import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const revision = 'a'.repeat(40);
const image = `chrozera/meerman.xyz:sha-${revision}`;

function runScript(t, script, overrides = {}) {
  const directory = mkdtempSync(join(tmpdir(), 'meerman-deploy-test-'));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const log = join(directory, 'commands.log');
  writeFileSync(join(directory, 'docker'), `#!/bin/sh
printf '%s\\n' "$*" >> "$COMMAND_LOG"
case "$1" in
  pull) exit "$PULL_STATUS" ;;
  image) printf '%s\\n' "$IMAGE_REVISION" ;;
  ps) echo existing-container ;;
  stop) exit "$STOP_STATUS" ;;
  run) echo new-container ;;
esac
`, { mode: 0o755 });
  writeFileSync(join(directory, 'curl'), `#!/bin/sh
if [ "$CURL_FAIL_ONCE" = "1" ] && [ ! -f "$CURL_SEEN" ]; then
  touch "$CURL_SEEN"
  echo old-revision
  exit 0
fi
printf '%s' "$PUBLIC_REVISION"
exit "$CURL_STATUS"
`, { mode: 0o755 });

  const result = spawnSync('sh', [fileURLToPath(new URL(script, import.meta.url)),
    'https://example.test', revision], {
    encoding: 'utf8',
    env: {
      ...process.env,
      PATH: `${directory}:${process.env.PATH}`,
      COMMAND_LOG: log,
      IMAGE_REF: image,
      EXPECTED_REVISION: revision,
      PULL_STATUS: '0',
      STOP_STATUS: '0',
      IMAGE_REVISION: revision,
      PUBLIC_REVISION: revision,
      CURL_STATUS: '0',
      CURL_FAIL_ONCE: '0',
      CURL_SEEN: join(directory, 'curl-seen'),
      DEPLOY_CHECK_ATTEMPTS: '1',
      DEPLOY_CHECK_DELAY: '0',
      ...overrides
    }
  });
  const commands = script === './deploy-container.sh' ? readFileSync(log, 'utf8') : '';
  return { ...result, commands };
}

test('disk-full pull fails without stopping or replacing the running site', t => {
  const result = runScript(t, './deploy-container.sh', { PULL_STATUS: '1' });
  assert.notEqual(result.status, 0);
  assert.equal(result.commands, `pull ${image}\n`);
});

test('a mismatched image revision leaves the running site untouched', t => {
  const result = runScript(t, './deploy-container.sh', { IMAGE_REVISION: 'old-revision' });
  assert.notEqual(result.status, 0);
  assert.doesNotMatch(result.commands, /^(stop|rm|run) /m);
});

test('successful deployment runs the exact published image', t => {
  const result = runScript(t, './deploy-container.sh');
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.commands, new RegExp(`^run .* ${image}$`, 'm'));
  assert.doesNotMatch(result.commands, /:latest/);
  assert.ok(result.commands.indexOf('pull ') < result.commands.indexOf('stop '));
});

test('a failed stop does not remove or start a container', t => {
  const result = runScript(t, './deploy-container.sh', { STOP_STATUS: '1' });
  assert.notEqual(result.status, 0);
  assert.doesNotMatch(result.commands, /^(rm|run) /m);
});

test('a public HTTP 200 serving an older revision fails verification', t => {
  assert.notEqual(runScript(t, './verify-revision.sh', { PUBLIC_REVISION: 'old-revision' }).status, 0);
});

test('an HTTP 200 SPA fallback fails verification', t => {
  assert.notEqual(runScript(t, './verify-revision.sh', { PUBLIC_REVISION: '<html>Old website</html>' }).status, 0);
});

test('an HTTP failure fails verification', t => {
  assert.notEqual(runScript(t, './verify-revision.sh', { CURL_STATUS: '22' }).status, 0);
});

test('the expected public revision passes verification', t => {
  const result = runScript(t, './verify-revision.sh');
  assert.equal(result.status, 0, result.stderr);
});

test('verification retries while the public site is switching revisions', t => {
  const result = runScript(t, './verify-revision.sh', {
    CURL_FAIL_ONCE: '1', DEPLOY_CHECK_ATTEMPTS: '2'
  });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stderr, /attempt 1\/2/);
});
