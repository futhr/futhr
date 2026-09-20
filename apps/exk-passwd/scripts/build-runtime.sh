#!/usr/bin/env sh
set -eu

script_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
app_dir=$(CDPATH= cd -- "$script_dir/.." && pwd)
runtime_dir="$app_dir/runtime"
release_dir="$runtime_dir/_release"
source_commit='6c3208c7b3dbc7dacc35a19f8de1fa80b358ac73'
image='emscripten/emsdk:4.0.8'
build_dir=$(mktemp -d "${TMPDIR:-/tmp}/exk-passwd-runtime.XXXXXX")

cleanup() {
  rm -rf "$build_dir"
}
trap cleanup EXIT INT TERM

git clone --filter=blob:none --no-checkout \
  https://github.com/software-mansion-labs/FissionVM.git "$build_dir/FissionVM"
git -C "$build_dir/FissionVM" checkout "$source_commit"
git -C "$build_dir/FissionVM" apply "$runtime_dir/fissionvm-webcrypto.patch"

docker run --rm --platform linux/amd64 \
  --volume "$build_dir/FissionVM:/source" \
  --workdir /source \
  "$image" \
  bash -euc '
    apt-get update -qq
    DEBIAN_FRONTEND=noninteractive apt-get install -y -qq \
      gperf libmbedtls-dev ninja-build zlib1g-dev >/dev/null
    mkdir -p src/platforms/emscripten/build
    cd src/platforms/emscripten/build
    emcmake cmake -G Ninja \
      -DCMAKE_BUILD_TYPE=Release \
      -DAVM_EMSCRIPTEN_ENV=web \
      ..
    ninja -j2 AtomVM
  '

rm -rf "$release_dir"
mkdir -p "$release_dir"
cp "$build_dir/FissionVM/src/platforms/emscripten/build/src/AtomVM.mjs" "$release_dir/"
cp "$build_dir/FissionVM/src/platforms/emscripten/build/src/AtomVM.wasm" "$release_dir/"

printf 'Built the pinned AtomVM WebCrypto runtime in %s.\n' "$release_dir"
