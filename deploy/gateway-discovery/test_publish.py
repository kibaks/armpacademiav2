import json,tempfile,unittest
from pathlib import Path
from publish import latest_gateway
class DiscoveryTests(unittest.TestCase):
 def test_rotation_and_saved_address_survive_a_log_without_the_startup_url(self):
  with tempfile.TemporaryDirectory() as tmp:
   log=Path(tmp)/'tunnel.log';state=Path(tmp)/'state.json'
   log.write_text('Unauthorized: Tunnel not found\n')
   rotated=Path(str(log)+'.1');rotated.write_text('Tunnel https://old-path.trycloudflare.com\n')
   self.assertEqual(latest_gateway(log,state),'https://old-path.trycloudflare.com')
   log.write_text('New tunnel https://new-path.trycloudflare.com\n')
   self.assertEqual(latest_gateway(log,state),'https://new-path.trycloudflare.com')
   log.unlink();rotated.unlink();state.write_text(json.dumps({'baseUrl':'https://saved-path.trycloudflare.com'}))
   self.assertEqual(latest_gateway(log,state),'https://saved-path.trycloudflare.com')
   state.write_text(json.dumps({'baseUrl':'https://example.com'}));self.assertIsNone(latest_gateway(log,state))
if __name__=='__main__':unittest.main()
