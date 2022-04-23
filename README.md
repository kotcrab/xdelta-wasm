# xdelta-wasm

Online xdelta patcher. It supports xdelta3 format with secondary compression enabled.

### [Try it here!](https://kotcrab.github.io/xdelta-wasm/)

### How this works

Frontend in React allows for selecting source and patch files.
Then a web worker is spawned which loads [Xdelta](https://github.com/jmacd/xdelta) C library compiled with Emscripten into web assembly.
Worker processes the files in chunks to allow handling of large files. Finally, StreamSaver library is used to save output file without using
too much memory.

### Building

Make sure to setup [Emscripten](https://emscripten.org/docs/getting_started/downloads.html) first. If you're on Windows you'll need to use WSL.

```
source ~/emsdk/emsdk_env.sh

./native/build.sh # Rerun everytime you change something in the native directory

npm run build     # Minified build
npm start         # or start development server
```

### Deploy

Native code must be compiled first before doing deploy.

```
npm run deploy
```
