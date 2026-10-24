"""Validate a clean source checkout without inheriting application credentials."""
from pathlib import Path
import os
import shutil
import subprocess
import argparse

ROOT = Path(__file__).resolve().parents[1]
if any(p.is_file() and p.name != '.env.example' for p in ROOT.glob('.env*')):
    raise SystemExit('Use a clean isolated checkout without dotenv files.')
env = {k: v for k, v in os.environ.items() if k.upper() in {
    'PATH', 'SYSTEMROOT', 'WINDIR', 'TEMP', 'TMP', 'COMSPEC', 'PATHEXT',
    'HOME', 'USERPROFILE', 'APPDATA', 'LOCALAPPDATA'}}
env.update(CI='true', NEXT_TELEMETRY_DISABLED='1',
           SHIDA_API_BASE_URL='https://127.0.0.1:9',
           NEXT_PUBLIC_APP_ORIGIN='http://127.0.0.1:3001',
           RESTAURANT_GUEST_PROXY_SECRET='isolated-test-only')
npm = shutil.which('npm.cmd' if os.name == 'nt' else 'npm')
if not npm:
    raise SystemExit('npm is required; use Node >=22.13.0.')
version = subprocess.check_output(['node', '--version'], env=env, text=True).strip()
if tuple(map(int, version.lstrip('v').split('.'))) < (22, 13, 0):
    raise SystemExit('Node >=22.13.0 is required.')
parser = argparse.ArgumentParser()
parser.add_argument("checks", nargs="*", choices=("build", "typecheck", "lint", "test"))
checks = parser.parse_args().checks or ("build", "typecheck", "lint", "test")
failed = []
# Build first generates Next route types required by a fresh checkout's typecheck.
for name in checks:
    print('VALIDATING ' + name, flush=True)
    check_env = env.copy()
    if name == 'test':
        # Preserve URL-contract fixtures; setup blocks real fetch/socket access.
        for key in ('SHIDA_API_BASE_URL', 'NEXT_PUBLIC_APP_ORIGIN', 'RESTAURANT_GUEST_PROXY_SECRET'):
            check_env.pop(key, None)
    if subprocess.run([npm, 'run', name], cwd=ROOT, env=check_env).returncode:
        failed.append(name)
if failed:
    raise SystemExit('Failed checks: ' + ', '.join(failed))
