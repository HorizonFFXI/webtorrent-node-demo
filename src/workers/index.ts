import { Worker, isMainThread, parentPort, workerData } from "worker_threads";
import WebTorrent from "webtorrent";
import FSChunkStore from "../lib/fs-chunk-store";

const MessageType = {
  UPLOAD_PROGRESS: "UPLOAD_PROGRESS",
  DOWNLOAD_PROGRESS: "DOWNLOAD_PROGRESS",
  DOWNLOAD_FINISHED: "DOWNLOAD_FINISHED",
  DOWNLOAD_ERROR: "DOWNLOAD_ERROR",
};

interface Props {
  magnetLink: string;
  path: string;
}
let downloadTorrent = (props: Props): void => {
  return;
};

if (isMainThread) {
  downloadTorrent = ({ magnetLink, path }) => {
    return new Promise((resolve, reject) => {
      if (!magnetLink || !path) {
        reject(new Error(`Provide magnetLink and path`));
      }

      const worker = new Worker(__filename, {
        workerData: { magnetLink, path },
      });

      worker.on("error", reject);
      worker.on("exit", (code: number) => {
        if (code !== 0)
          reject(new Error(`Worker stopped with exit code ${code}`));
      });

      worker.on(
        "message",
        (message: { type: keyof typeof MessageType; data: any }) => {
          // console.log("message", message);

          switch (message.type) {
            case MessageType.DOWNLOAD_FINISHED:
              resolve(message.data.magnetLink);
              break;
            case MessageType.DOWNLOAD_ERROR:
              reject(new Error(message.data.error));
              break;
            case MessageType.DOWNLOAD_PROGRESS:
            case MessageType.UPLOAD_PROGRESS:
            default:
              console.log(message);
              break;
          }
        }
      );
    });
  };
} else {
  // Get parameters through workerData object
  const { magnetLink, path } = workerData;

  const THROTTLE_BYTES = 5 * 1e6; // 5mb in bytes

  // Create a webtorrent client
  const client = new WebTorrent();

  client.add(
    magnetLink,
    {
      strategy: "rarest",
      // @ts-ignore
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
      // @ts-ignore
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

export { downloadTorrent };
