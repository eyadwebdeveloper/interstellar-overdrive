#!/bin/bash
# Compiles the pure adapter modules to CommonJS in /tmp and runs the separation tests.
cd "$(dirname "$0")/../.."
rm -rf /tmp/aura-out
npx tsc --ignoreConfig src/api/adapters.ts src/api/contract.ts src/data/vitalsData.ts --outDir /tmp/aura-out --rootDir src --module commonjs --target es2022 --skipLibCheck || exit 1
node _technical_support/aura-integration/adapters.test.cjs
