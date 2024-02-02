# xdelta-wasm

Online xdelta patcher. It supports xdelta3 format with secondary compression enabled.

### [Use it here!](https://kotcrab.github.io/xdelta-wasm/)

### How this works

Frontend in React allows for selecting source and patch files.
Then a web worker is spawned which loads [Xdelta](https://github.com/jmacd/xdelta) C library compiled with Emscripten into web assembly.
Worker processes the files in chunks to allow handling of large files. Finally, StreamSaver library is used to save output file without using
too much memory.

### Building

Make sure to setup [Emscripten](https://emscripten.org/docs/getting_started/downloads.html) first. If you're on Windows you'll need to use WSL.
First setup emsdk:
```
source ~/emsdk/emsdk_env.sh
```

Next you will need to build XZ Utils, this needs to be done only once:

```
./native/build-xz.sh
```

Now you can build the xdelta itself, this needs to be re-run if the xdelta sources change:

```
./native/build.sh
```

Finally, you can build the frontend or start the development server.

```
npm run build     # Minified build
npm start         # or start development server
```

### Deploy

Native code must be compiled first before doing deploy.

```
npm run deploy
```
