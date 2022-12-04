const { workerData, BroadcastChannel, parentPort } = require("worker_threads");
const WebTorrent = require("webtorrent");
const FSChunkStore = require("../lib/fs-chunk-store");

const bc = new BroadcastChannel("webtorrent");
const client = new WebTorrent();

const torrentId =
  "magnet:?xt=urn:btih:08ada5a7a6183aae1e09d831df6748d566095a10&dn=Sintel&tr=udp%3A%2F%2Fexplodie.org%3A6969&tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969&tr=udp%3A%2F%2Ftracker.empire-js.us%3A1337&tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337&tr=wss%3A%2F%2Ftracker.btorrent.xyz&tr=wss%3A%2F%2Ftracker.fastcast.nz&tr=wss%3A%2F%2Ftracker.openwebtorrent.com&ws=https%3A%2F%2Fwebtorrent.io%2Ftorrents%2F&xs=https%3A%2F%2Fwebtorrent.io%2Ftorrents%2Fsintel.torrent";

client.add(
  torrentId,
  {
    strategy: "rarest",
    store: FSChunkStore,
    path: workerData.path,
  },
  function (torrent) {
    torrent.on("done", function () {
      parentPort.postMessage("close");
      bc.postMessage("done");
      bc.close();
    });

    torrent.on("error", function () {
      parentPort.postMessage("close");
      bc.postMessage("error");
      bc.close();
    });

    torrent.on("download", function (bytes) {
      bc.postMessage(bytes);
    });
  }
);
