# xdelta-wasm

Proof of concept xdelta3 patcher running in the browser.

### How this works

Frontend in React allows for selecting input and patch files.
Then a web worker is spawned which loads [Xdelta](https://github.com/jmacd/xdelta) C library compiled with Emscripten into web assembly.
It processes the files in chunks to allow handling of large files. Finally, StreamSaver library is used to save large files without using
too much memory.

### Building

```
source ~/emsdk/emsdk_env.sh
./native/build.sh
npm run build # Minified build
npm start # or start development server
```

### Deploy

```
npm run deploy
```
