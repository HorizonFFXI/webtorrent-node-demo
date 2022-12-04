import { isMainThread, parentPort, workerData } from "worker_threads";
import WebTorrent from "webtorrent";
import FSChunkStore from "fs-chunk-store";

const MessageType = {
  UPLOAD_PROGRESS: "UPLOAD_PROGRESS",
  DOWNLOAD_PROGRESS: "DOWNLOAD_PROGRESS",
  DOWNLOAD_FINISHED: "DOWNLOAD_FINISHED",
  DOWNLOAD_ERROR: "DOWNLOAD_ERROR",
};

if (!isMainThread) {
  // Get parameters through workerData object
  const { magnetLink, path } = workerData;

  const THROTTLE_BYTES = 5 * 1e6; // 5mb in bytes

  // Create a webtorrent client
  const client = new WebTorrent();

  client.add(
    magnetLink,
    {
      strategy: "rarest",
      store: FSChunkStore,
      path,
    },
    function (torrent) {
      // Throttle progress messages
      let _downloadBytes = 0;
      torrent.on("download", function (bytes) {
        _downloadBytes += bytes;

        if (_downloadBytes >= THROTTLE_BYTES) {
          parentPort.postMessage({
            type: MessageType.DOWNLOAD_PROGRESS,
            data: {
              magnetLink,
              downloaded: torrent.downloaded,
              downloadSpeed: torrent.downloadSpeed,
              progress: torrent.progress,
            },
          });
          _downloadBytes = 0;
        }
      });

      // Throttle progress messages
      let _uploadBytes = 0;
      torrent.on("uploaded", function (bytes) {
        _uploadBytes += bytes;

        if (_uploadBytes >= THROTTLE_BYTES) {
          parentPort.postMessage({
            type: MessageType.UPLOAD_PROGRESS,
            data: {
              magnetLink,
              downloaded: torrent.uploaded,
              downloadSpeed: torrent.uploadSpeed,
              progress: torrent.ratio,
            },
          });
          _uploadBytes = 0;
        }
      });

      torrent.on("done", function () {
        // Set the last progress update so it fills to 100%
        parentPort.postMessage({
          type: MessageType.DOWNLOAD_PROGRESS,
          data: {
            magnetLink,
            downloaded: torrent.downloaded,
            downloadSpeed: torrent.downloadSpeed,
            progress: torrent.progress,
          },
        });

        parentPort.postMessage({
          type: MessageType.DOWNLOAD_FINISHED,
          data: {
            magnetLink,
          },
        });
      });

      torrent.on("error", function (error) {
        parentPort.postMessage({
          type: MessageType.DOWNLOAD_ERROR,
          data: {
            error,
          },
        });
      });
    }
  );

  process.on("exit", () =>
    parentPort.postMessage({
      type: "ETC",
      data: "worker thread (inside) exited",
    })
  );
}
