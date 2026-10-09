"""Run the Backend's supported isolated validator; keep evidence in the website.
No Backend source changes, local secrets or application databases are used.
"""
from pathlib import Path
import sys
import uuid
root=Path(__file__).resolve().parents[2]
runner=root.parent/'Backend/scripts/run_platform_validation.py'
source=runner.read_text(encoding='utf-8').replace(
    'run = root / "logs" / "platform-validation" / uuid.uuid4().hex',
    'run = Path(' + repr(str(root/'.s3a-local/09b2-backend-checks')) + ') / uuid.uuid4().hex')
if len(sys.argv)==1:
    sys.argv.extend(['--single-process','tests/test_restaurant_guest_visits.py',
        'tests/test_restaurant_guest_http.py','tests/test_restaurant_guest_migration.py',
        'tests/test_restaurant_r3a2.py','tests/test_restaurant_personal_api.py'])
if not any(arg.startswith('--basetemp') for arg in sys.argv):
    # Keep disposable migration databases in this account's writable workspace.
    sys.argv.append('--basetemp=' + str(root/'.s3a-local/09b2-pytest-temp'/uuid.uuid4().hex))
exec(compile(source,str(runner),'exec'),{'__file__':str(runner),'__name__':'__main__'})
