#!/bin/bash

set -euxo pipefail

BASE="./native"
OBJS="./native/out"
XZ_BASE="$BASE/xz/xz-5.4.6"
FLAGS="-O2" # for optimized build
#FLAGS=""   # for debug build
CFLAGS="$FLAGS -I $BASE/xdelta/xdelta3 -I $XZ_BASE/src/liblzma/api -D XD3_USE_LARGEFILE64=0 -D SIZEOF_SIZE_T=4 -D SECONDARY_DJW -D SECONDARY_FGK -D SECONDARY_LZMA"

emcc -c $BASE/xdelta/xdelta3/xdelta3.c -o $OBJS/xdelta3.o $CFLAGS
emcc -c $BASE/xdelta3-wasm.c -o $OBJS/xdelta3-wasm.o $CFLAGS
emcc -o public/xdelta3.js \
  $XZ_BASE/src/liblzma/.libs/liblzma.a \
  $OBJS/xdelta3.o $OBJS/xdelta3-wasm.o \
  $FLAGS \
  -s ENVIRONMENT="worker" \
  -s EXPORTED_RUNTIME_METHODS="['callMain', 'UTF8ToString']" \
  -s EXPORTED_FUNCTIONS="['_main']" \
  -s INVOKE_RUN=0 \
  -s INITIAL_MEMORY=52428800 \
  -s ALLOW_MEMORY_GROWTH=0 \
  -s MODULARIZE=1 \
  -s EXPORT_ES6=1 \
  -s EXPORT_NAME=createXdelta3Module
