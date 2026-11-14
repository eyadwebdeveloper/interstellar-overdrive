#!/bin/bash
# Verifies the Vite /api proxy against the mock backend, then with the backend stopped.
cd "$(dirname "$0")/../.."
python3 _technical_support/aura-integration/mock_backend.py 8000 </dev/null >/tmp/mock.log 2>&1 &
MOCK=$!
npx vite --port 3111 --strictPort </dev/null >/tmp/dev.log 2>&1 &
DEV=$!
for i in $(seq 1 30); do curl -s -o /dev/null -m 1 http://127.0.0.1:3111/ && break; sleep 0.5; done
echo "proxy health:   $(curl -s -m 3 http://127.0.0.1:3111/api/health)"
curl -s -m 3 http://127.0.0.1:3111/api/astronauts/cmdr/snapshot | python3 -c "import sys,json;d=json.load(sys.stdin);print('proxy snapshot:',d['astro_id'],'tier0 alerts',len(d['tier0']['alerts']),'notices',len(d['tier1']['notices']),'band',d['tier2']['risk']['band'])"
kill $MOCK; sleep 1
echo "backend down -> proxy status: $(curl -s -m 5 -o /dev/null -w '%{http_code}' http://127.0.0.1:3111/api/health)"
kill $DEV
