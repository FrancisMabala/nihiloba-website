"""Run real two-user acceptance using installed dependencies and disposable local data."""
import os,sys,subprocess,time,socket,shutil
from pathlib import Path
from tempfile import mkdtemp
root=Path(__file__).resolve().parents[1]
backend=Path(sys.argv[1]).resolve()
assert (backend/'app/services/meda_service.py').is_file()
assert not any(p.name!='.env.example' and p.is_file() for p in root.glob('.env*'))
env={k:v for k,v in os.environ.items() if k.upper() in {'PATH','SYSTEMROOT','WINDIR','TEMP','TMP','COMSPEC','PATHEXT','USERPROFILE','APPDATA','LOCALAPPDATA','PROGRAMFILES','PROGRAMFILES(X86)'}}
env.update(CI='true',NEXT_TELEMETRY_DISABLED='1',PYTHONUTF8='1')
for port in (8067,3067):
 with socket.socket() as check:
  try:check.bind(('127.0.0.1',port))
  except OSError:raise SystemExit('Acceptance port occupied: '+str(port))
evidence=Path(mkdtemp(prefix='shida-meda-real-'))
print('Evidence: '+str(evidence),flush=True)
with (evidence/'backend.log').open('w',encoding='utf-8') as log:
 process=subprocess.Popen([sys.executable,str(root/'scripts/meda-acceptance-backend.py'),str(backend)],env=env,cwd=root,stdout=log,stderr=subprocess.STDOUT)
 try:
  for attempt in range(180):
   if process.poll() is not None:raise RuntimeError('Acceptance backend failed; see evidence log')
   try:
    with socket.create_connection(('127.0.0.1',8067),timeout=1):break
   except OSError:time.sleep(1)
  else:raise RuntimeError('Acceptance backend startup timed out')
  result=subprocess.run([shutil.which('node'),'node_modules/@playwright/test/cli.js','test','--config=playwright.meda-acceptance.config.ts'],env=env,cwd=root)
  raise SystemExit(result.returncode)
 finally:
  process.terminate()
  try:process.wait(timeout=15)
  except subprocess.TimeoutExpired:process.kill();process.wait()
