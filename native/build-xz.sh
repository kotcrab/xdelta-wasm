#!/bin/bash

set -euxo pipefail

DIR=./native/xz
ARCHIVE=$DIR/xz.tar.gz
mkdir -p ./native/xz
curl -L https://github.com/tukaani-project/xz/releases/download/v5.4.6/xz-5.4.6.tar.gz > $ARCHIVE
tar -xzf $ARCHIVE -C $DIR
cd $DIR/xz-5.4.6
emconfigure ./configure --disable-shared
emmake make
