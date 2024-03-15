import "dotenv/config";
import { app, BrowserWindow, globalShortcut, ipcMain, dialog } from "electron";
import path from "path";
import fs from "fs";
import { homedir } from "os";
import openai from "./apis/openai";

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require("electron-squirrel-startup")) {
  app.quit();
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    autoHideMenuBar: true,
    frame: false,
    width: 350,
    height: 500,
    x: 0,
    y: 0,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`)
    );
  }
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", createWindow);
app.on("window-all-closed", () => {
  console.log("window-all-closed");
});

app.on("activate", () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.whenReady().then(() => {
  const ret = globalShortcut.register("CommandOrControl+Shift+K", () => {
    createWindow();
  });

  if (!ret) {
    console.log("registration failed");
  }

  // Check whether a shortcut is registered.
  console.log(globalShortcut.isRegistered("CommandOrControl+Shift+K"));
});

app.on("will-quit", () => {
  // Unregister all shortcuts.
  globalShortcut.unregisterAll();
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
function generateUniqueId() {
  return "id-" + Math.random().toString(36).substr(2, 16);
}
const systemMessage = {
  role: "system",
  content:
    "You are a helpful AI assistant. You will output all of your responses in markdown format",
};

let messages = [systemMessage];

ipcMain.on("chat-message", async (event, message) => {
  const messageID = generateUniqueId();

  messages.push({ role: "user", content: message });

  const stream = await openai.chat.completions.create({
    model: "gpt-4",
    messages,
    stream: true,
  });

  let response = "";
  for await (const chunk of stream) {
    const chunkContent = chunk.choices[0]?.delta?.content || "";
    response += chunkContent;
    event.sender.send("chat-response", { message: response, id: messageID });
  }

  messages.push({ role: "assistant", content: response });
});

ipcMain.on("save-chat", async (event) => {
  const downloadDir = path.resolve(homedir(), "Downloads");
  const { canceled, filePath } = await dialog.showSaveDialog({
    title: "Save Chat",
    defaultPath: `${downloadDir}/chat.json`,
    filters: [{ name: "JSON Files", extensions: ["json"] }],
  });

  if (canceled) return;

  fs.writeFileSync(filePath, JSON.stringify(messages, null, 2));

  return event.sender.send("chat-saved");
});

ipcMain.on("exit", (event) => {
  const frame = BrowserWindow.fromWebContents(event.sender);
  frame?.close();
  messages = [systemMessage];
});

ipcMain.on("load-chat", async (event) => {
  const downloadDir = path.resolve(homedir(), "Downloads");
  const { canceled, filePaths } = await dialog.showOpenDialog({
    title: "Load Chat",
    defaultPath: downloadDir,
    filters: [{ name: "JSON Files", extensions: ["json"] }],
  });

  if (canceled) return;

  const chat = JSON.parse(fs.readFileSync(filePaths[0], "utf-8"));
  messages = chat;

  return event.sender.send("load-chat", messages);
});
