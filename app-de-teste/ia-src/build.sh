#!/bin/bash
# Gera public/ia/ (IA do app de teste). Rodar depois de "npm ci" nesta pasta.
set -e
cd "$(dirname "$0")"
mkdir -p ../public/ia
npx esbuild vozia.ts --bundle --format=esm --minify --target=es2020 --alias:onnxruntime-web=onnxruntime-web/wasm --outfile=../public/ia/vozia.js
cp node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.mjs ../public/ia/ort-wasm-simd-threaded.js
cp node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.wasm ../public/ia/
rm -f ../public/ia/ort-wasm-simd-threaded.mjs
