"""Dedicated account notification scheduler; no Firebase or email credentials."""
import json, logging, os, time, urllib.request, urllib.error
logging.basicConfig(level=logging.INFO, format='%(asctime)s %(message)s')
secret = os.environ['INITIATION_SCHEDULER_SECRET']
if len(secret) < 32:
    raise RuntimeError('Scheduler credential required')
interval=max(60,int(os.environ.get('INITIATION_SCAN_INTERVAL_SECONDS','300')))
backoff=interval
while True:
    started = time.monotonic()
    try:
        request = urllib.request.Request(
            'https://armpacademiav2.vercel.app/api/internal/initiation-expiry',
            data=b'{}', method='POST',
            headers={'Authorization': 'Bearer ' + secret, 'Content-Type': 'application/json'})
        with urllib.request.urlopen(request, timeout=290) as response:
            result = json.load(response)
            backoff=interval
            logging.info('Scan: checked=%s sent=%s failed=%s', result.get('scanned', 0), result.get('sent', 0), result.get('failed', 0))
    except urllib.error.HTTPError as error:
        logging.warning('Scan pending: HTTP %s', error.code)
        backoff=min(1800,max(interval,backoff*2))
    except Exception as error:
        logging.warning('Scan pending: %s', type(error).__name__)
        backoff=min(1800,max(interval,backoff*2))
    time.sleep(max(1, backoff - (time.monotonic() - started)))
