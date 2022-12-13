import { app, BrowserWindow, dialog } from "electron";
import log from "electron-log";
import { createWindow } from "./createWindow";
import { downloadTorrent } from "./workers/torrent_main";

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

  // Download a magnet link using a worker
  try {
    const results = await downloadTorrent({
      magnetLink:
        "magnet:?xt=urn:btih:6fb2be0f6448fbad2a620c7d934f9d90674bcc16&dn=Roger%20Waters%20-%20The%20Lockdown%20Sessions%20(2022)%20Mp3%20320kbps%20%5bPMEDIA%5d%20%e2%ad%90%ef%b8%8f&tr=http%3a%2f%2ftracker2.wasabii.com.tw%3a6969%2fannounce%2cudp%3a%2f%2ftracker.sktorrent.net%3a6969%2fannounce%2chttp%3a%2f%2fwww.wareztorrent.com%3a80%2fannounce%2cudp%3a%2f%2fbt.xxx-tracker.com%3a2710%2fannounce%2cudp%3a%2f%2ftracker.eddie4.nl%3a6969%2fannounce%2cudp%3a%2f%2ftracker.grepler.com%3a6969%2fannounce%2cudp%3a%2f%2ftracker.mg64.net%3a2710%2fannounce%2cudp%3a%2f%2fwambo.club%3a1337%2fannounce%2cudp%3a%2f%2ftracker.dutchtracking.com%3a6969%2fannounce%2cudp%3a%2f%2ftc.animereactor.ru%3a8082%2fannounce%2cudp%3a%2f%2ftracker.justseed.it%3a1337%2fannounce%2cudp%3a%2f%2ftracker.leechers-paradise.org%3a6969%2fannounce%2cudp%3a%2f%2ftracker.opentrackr.org%3a1337%2fannounce%2chttps%3a%2f%2fopen.kickasstracker.com%3a443%2fannounce%2cudp%3a%2f%2ftracker.coppersurfer.tk%3a6969%2fannounce%2cudp%3a%2f%2fopen.stealth.si%3a80%2fannounce%2chttp%3a%2f%2f87.253.152.137%2fannounce%2chttp%3a%2f%2f91.216.110.47%2fannounce%2chttp%3a%2f%2f91.217.91.21%3a3218%2fannounce%2chttp%3a%2f%2f91.218.230.81%3a6969%2fannounce%2chttp%3a%2f%2f93.92.64.5%2fannounce%2chttp%3a%2f%2fatrack.pow7.com%2fannounce%2chttp%3a%2f%2fbt.henbt.com%3a2710%2fannounce%2chttp%3a%2f%2fbt.pusacg.org%3a8080%2fannounce%2chttps%3a%2f%2ftracker.bt-hash.com%3a443%2fannounce%2cudp%3a%2f%2ftracker.leechers-paradise.org%3a6969%2cudp%3a%2f%2fzephir.monocul.us%3a6969%2fannounce%2chttps%3a%2f%2ftracker.dutchtracking.com%3a80%2fannounce%2chttps%3a%2f%2fgrifon.info%3a80%2fannounce%2cdp%3a%2f%2ftracker.kicks-ass.net%3a80%2fannounce%2cudp%3a%2f%2fp4p.arenabg.com%3a1337%2fannounce%2cudp%3a%2f%2ftracker.aletorrenty.pl%3a2710%2fannounce%2cudp%3a%2f%2ftracker.sktorrent.net%3a6969%2fannounce%2cudp%3a%2f%2ftracker.internetwarriors.net%3a1337%2fannounce%2chttps%3a%2f%2ftracker.parrotsec.org%3a443%2fannounce%2chttps%3a%2f%2ftracker.moxing.party%3a6969%2fannounce%2chttps%3a%2f%2ftracker.ipv6tracker.ru%3a80%2fannounce%2chttps%3a%2f%2ftracker.fastdownload.xyz%3a443%2fannounce%2cudp%3a%2f%2fopen.stealth.si%3a80%2fannounce%2chttps%3a%2f%2fgwp2-v19.rinet.ru%3a80%2fannounce%2chttps%3a%2f%2ftr.kxmp.cf%3a80%2fannounce%2chttps%3a%2f%2fexplodie.org%3a6969%2fannounce",
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
