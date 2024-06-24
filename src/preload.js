const { ipcRenderer, contextBridge } = require("electron");

const api = {
    readGenome: (path) => ipcRenderer.invoke("read-genome", path),
    resizeWindow: (width, height) => ipcRenderer.invoke("resize-window", width, height),
    LAMP: (request) => ipcRenderer.invoke("LAMP", request),
    console: (text) => ipcRenderer.invoke("console", text),
    openSet: (set) => ipcRenderer.invoke("open-set", set),
    copyToClipboard: (str) => ipcRenderer.invoke("clipboard-copy", str),
    saveFile: (data) => ipcRenderer.invoke("save-file", data)
}

contextBridge.exposeInMainWorld("api", api);

contextBridge.exposeInMainWorld(
    'bridge', {
        getData: (data) => {
            ipcRenderer.on('get-data', data);
        }
    }
);