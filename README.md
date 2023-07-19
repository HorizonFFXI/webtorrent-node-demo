# Attempting to get webtorrent working with electron forge

This repo is a minimal demo of integrating webtorrent and electronforge. Webtorrent is integrated in a worker thread on the nodejs side, rather than in the browser side.

## Commands

- `npm run start` to get it going in a dev environment
- `npm run make` to build the installer

## Issues

Currently, the built (`npm run make`) version fails to download a torrent. This is because webpack is not bundling in dependencies into the worker chunk, and that JS file can't find the `webtorrent` package.

## Troubleshooting help

- Logs are written to `%AppData%\Roaming\webtorrent-test\logs\main.log`. This is helpful to debug errors and logs in the `make` exe.
- Downloads are saved in your system's Downloads folder (eg: `C:\Users\Flam\Downloads\`)
- This tries to download a folder for a video called `Cosmos Laundromat` in your downloads folder. It works with `npm run start` but not with `npm run main`.


## Fix

My fix / workaround can be seen here https://github.com/HorizonFFXI/webtorrent-node-demo/pull/2
