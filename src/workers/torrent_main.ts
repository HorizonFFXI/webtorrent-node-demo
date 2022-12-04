import { Worker } from "worker_threads";
const MessageType = {
  UPLOAD_PROGRESS: "UPLOAD_PROGRESS",
  DOWNLOAD_PROGRESS: "DOWNLOAD_PROGRESS",
  DOWNLOAD_FINISHED: "DOWNLOAD_FINISHED",
  DOWNLOAD_ERROR: "DOWNLOAD_ERROR",
};

export const downloadTorrent = ({
  magnetLink,
  path,
}: {
  magnetLink: string;
  path: string;
}) => {
  return new Promise((resolve, reject) => {
    if (!magnetLink || !path) {
      reject(new Error(`Provide magnetLink and path`));
    }

    const worker = new Worker(
      // eslint-disable-next-line
      // @ts-ignore
      new URL("./torrent_worker.mjs", import.meta.url),
      {
        workerData: { magnetLink, path },
      }
    );

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
