// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  sendChatMessage: (context: any) => ipcRenderer.send("chat-message", context),
  saveChat: (context: any) => ipcRenderer.send("save-chat", context),
  onChatResponse: (callback: any) => ipcRenderer.on("chat-response", callback),
  onChatSaved: (callback: any) => ipcRenderer.on("chat-saved", callback),
  exit: () => ipcRenderer.send("exit"),
  loadChat: () => ipcRenderer.send("load-chat"),
  onLoadChat: (callback: any) => ipcRenderer.on("load-chat", callback),
});
