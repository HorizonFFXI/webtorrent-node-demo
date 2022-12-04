import { app, BrowserWindow, dialog } from "electron";
import log from "electron-log";
import { createWindow } from "./createWindow";
import downloadTorrent from "./workers/torrentDownload";

// Extend console.log to also write to a log file in
// \AppData\Roaming\HorizonXI-Launcher\logs\main.log
const consoleLog = console.log;
console.log = (...args: any[]) => {
  consoleLog.apply(console, args);
  log.log(args);
};

log.catchErrors({
  showDialog: false,
  onError(error, versions, submitIssue) {
    dialog
      .showMessageBox({
        title: "An error occurred",
        message: error.message,
        detail: error.stack,
        type: "error",
        buttons: ["Ignore", "Report", "Exit"],
      })
      .then((result) => {
        if (result.response === 1) {
          submitIssue &&
            submitIssue(
              "https://github.com/HorizonFFXI/HorizonXI-Issues/issues/new?assignees=&labels=bug&template=bug_report.md&title=%F0%9F%90%9B%5BBUG%5D%5BNPC%2FQuest%2FMission%2FSystem%2FCombat%2FLauncher%2FWebsite%5D",
              {}
            );
          return;
        }

        if (result.response === 2) {
          app.quit();
        }
      });
  },
});

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require("electron-squirrel-startup")) {
  app.quit();
}

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let window: BrowserWindow;

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", async () => {
  window = createWindow();

  try {
    const results = await downloadTorrent({
      magnetLink:
        "magnet:?xt=urn:btih:c9e15763f722f23e98a29decdfae341b98d53056&dn=Cosmos+Laundromat&tr=udp%3A%2F%2Fexplodie.org%3A6969&tr=udp%3A%2F%2Ftracker.coppersurfer.tk%3A6969&tr=udp%3A%2F%2Ftracker.empire-js.us%3A1337&tr=udp%3A%2F%2Ftracker.leechers-paradise.org%3A6969&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337&tr=wss%3A%2F%2Ftracker.btorrent.xyz&tr=wss%3A%2F%2Ftracker.fastcast.nz&tr=wss%3A%2F%2Ftracker.openwebtorrent.com&ws=https%3A%2F%2Fwebtorrent.io%2Ftorrents%2F&xs=https%3A%2F%2Fwebtorrent.io%2Ftorrents%2Fcosmos-laundromat.torrent",
      path: app.getPath("downloads"),
    });
    console.log("results", results);
  } catch (error) {
    console.log("error", error);
  }
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
