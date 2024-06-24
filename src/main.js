const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('node:path');
var XLSX = require("xlsx");




if (require('electron-squirrel-startup')) {
  app.quit();
}





function getGenome(path) {

  const { readFileSync } = require('node:fs');

  var genome = readFileSync(path, 'utf-8');

  return genome;

}

function getInitialRequest() {

  const genome = getGenome(path.join(__dirname, 'genome.txt'));

  const request = {
      "COMPUTING": {
          "THREADS": 4,
          "DOUBLE_DIVERGENCE": 0.01,
          "DO_SKIP": false
      },
      "PRIMER_SEARCH": {
          "LENGTH_RANGE": [ 20, 25 ],
          "NA_PLUS": 0.05,
          "RMV_REPEAT_AMOUNT": 4,
          "GC_RANGE": [ 40.0, 60.0 ],
          "TM_RANGE": [ 55.0, 65.0 ]
      },
      "PRIMER_SORTING": {
          "POSITIONS": [ false, false, true, false, true, true],
          "DISTANCE_RANGE": [1, 10, 10, 25, 0, 30, 10, 25, 1, 10],
          "AMPLICON_RANGE": [ 120, 220 ],
          "LENGTH_MAX_DIFF": 3,
          "TM_MAX_DIFF": 2,
      },
      "DIMER": {
          "DIMER_END": 3
      },
      "GENOME": {
          "DO_PARTIAL": false,
          "START": 0,
          "END": 29902,
          "GENOME": genome
      }
  };

  return request;

}

function loadDLL() {

  var ffi = require('ffi-napi');

  const DLL = new ffi.Library(path.join(__dirname, 'LAMP_DLL.dll'), {
    "design_primers": [ "string", ["string"]]
  });

  return DLL;

}

const DLL = loadDLL();

function makeRequest(request) {


  const result = DLL.design_primers(JSON.stringify(request));

  return JSON.parse(result);

}




const createWindow = () => {

  const start_with_second = false;

  if (start_with_second) {
    openResultWindow(makeRequest(getInitialRequest()));
  } else {
    openRequestWindow();
  }

};

function openRequestWindow() {

  const requestWindow = new BrowserWindow({
    width: 700,
    height: 180,
    maximizable: false,
    resizable: false,
    autoHideMenuBar: true,
    icon: path.join(__dirname, 'images/icon.png'),
    webPreferences: {
      nodeIntegration: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  requestWindow.loadFile(path.join(__dirname, 'request.html'));

}

function openResultWindow(request) {

  const resultWindow = new BrowserWindow({
    width: 700,
    height: 800,
    maximizable: false,
    resizable: false,
    autoHideMenuBar: true,
    icon: path.join(__dirname, 'images/icon.png'),
    webPreferences: {
      nodeIntegration: true,
      preload: path.join(__dirname, 'preload.js'),
    }
  });

  resultWindow.loadFile(path.join(__dirname, 'result.html'));

  resultWindow.webContents.on('did-finish-load', () => {

    //resultWindow.webContents.openDevTools();
    
    resultWindow.webContents.send('get-data', request);
  
  });

}

function openSetWindow(set) {

  const setWindow = new BrowserWindow({
    width: 900,
    height: 700,
    maximizable: false,
    resizable: false,
    autoHideMenuBar: true,
    icon: path.join(__dirname, 'images/icon.png'),
    webPreferences: {
      nodeIntegration: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  setWindow.loadFile(path.join(__dirname, 'set.html'));

  setWindow.webContents.on('did-finish-load', () => {
    
    setWindow.webContents.send('get-data', set);
  
  });

}




app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});



ipcMain.handle("read-genome", async (_, path) => { // Maybe async is not needed
  
  return getGenome(path);

})

ipcMain.handle("resize-window", (event, width, height) => {

  let browserWindow = BrowserWindow.fromWebContents(event.sender);

  browserWindow.setSize(width, height);
  browserWindow.center();

});

ipcMain.handle("LAMP", (_, request) => {

  const res = makeRequest(request);

  openResultWindow(res);

});

ipcMain.handle("console", (_, text) => {
  console.log(text);
});

ipcMain.handle("open-set", (_, set) => {
  openSetWindow(set);
});

ipcMain.handle("clipboard-copy", (_, str) => {
  
  const { clipboard } = require('electron');

  clipboard.writeText(str);

});










function nextCell(cell, row_step, col_step) {
  return String.fromCharCode(cell.substring(0, 1).charCodeAt(0) + col_step) + (Number(cell.substring(1)) + row_step);
}

function setCell(ws, cell, value) {
  XLSX.utils.sheet_add_aoa(ws, [[value]], { origin: cell });
}

function setNameAndVal(ws, cell, name, value) {
  setCell(ws, cell, name);
  const val_cell = nextCell(cell, 1, 0);
  setCell(ws, val_cell, value);
}

function getSequence(primer) {
  if (primer["type"] == "base") {
    return primer["base_seq"];
  } else {
    return primer["comp_seq"];
  }
}

function setPrimer(ws, cell, index, primer) {
  setCell(ws, nextCell(cell, 0, 1), index);
  setCell(ws, nextCell(cell, 1, 0), getSequence(primer));
  
  const pos_cell = nextCell(cell, 2, 0);
  setNameAndVal(ws, pos_cell, "Start", primer["start"] + 1);
  setNameAndVal(ws, nextCell(pos_cell, 0, 1), "Length", primer["length"]);
  setNameAndVal(ws, nextCell(pos_cell, 0, 2), "End", primer["end"] + 1);

  const par_cell = nextCell(cell, 4, 0);
  setNameAndVal(ws, par_cell, "GC", primer["GC"].toFixed(2));
  setNameAndVal(ws, nextCell(par_cell, 0, 2), "Tm", primer["Tm"].toFixed(2));
}

function getAmplicon(data) {
  var res = "";
  for (let i = 0; i < data["primers_amount"]; i++) {
    res += getSequence(data["primers"][i]);
    res += " \n";
  }
  return res;
}

function getSheet(data) {

  let ws = XLSX.utils.json_to_sheet([]);

  setCell(ws, "H3", "Position");
  setNameAndVal(ws, "G4", "Start", data["start"] + 1);
  setNameAndVal(ws, "H4", "Length", data["length"]);
  setNameAndVal(ws, "I4", "End", data["end"] + 1);

  setCell(ws, "H7", "Temperature");
  setNameAndVal(ws, "G8", "Minimum", data["MAX_TM"].toFixed(2));
  setNameAndVal(ws, "H8", "Difference", (data["MIN_TM"] - data["MAX_TM"]).toFixed(2));
  setNameAndVal(ws, "I8", "Maximum", data["MIN_TM"].toFixed(2));

  setCell(ws, "H11", "Amplicon");
  setCell(ws, "C12", getAmplicon(data));

  setCell(ws, "H14", "Primers");

  var prim_cell = "C15"

  var primer_indexes = [];
  if (data["primers_amount"] == 6) {
    primer_indexes = ["F3", "F2", "F1c", "B1c", "B2", "B3"];
    for (let i = 0; i < 3; i++) {
      setPrimer(ws, prim_cell, primer_indexes[i], data["primers"][i]);
      prim_cell = nextCell(prim_cell, 0, 4);
    }

    prim_cell = "C22";
    for (let i = 3; i < 6; i++) {
      setPrimer(ws, prim_cell, primer_indexes[i], data["primers"][i]);
      prim_cell = nextCell(prim_cell, 0, 4);
    }

  } else {
    primer_indexes = ["F3", "F2", "L1", "F1c", "B1c", "L2", "B2", "B3"];

    for (let i = 0; i < 4; i++) {
      setPrimer(ws, prim_cell, primer_indexes[i], data["primers"][i]);
      prim_cell = nextCell(prim_cell, 0, 4);
    }

    prim_cell = "C25";
    for (let i = 4; i < 8; i++) {
      setPrimer(ws, prim_cell, primer_indexes[i], data["primers"][i]);
      prim_cell = nextCell(prim_cell, 0, 4);
    }
  }

  return ws;

}

function getWorkbook(data) {

  let wb = XLSX.utils.book_new();

  let ws = getSheet(data);
  
  XLSX.utils.book_append_sheet(wb, ws, "Set " + (data["INDEX"] + 1));

  return wb;
};

ipcMain.handle("save-file", (_, data) => {

  const wb = getWorkbook(data);

  dialog.showSaveDialog({
    title: 'Select the file path to save',
    buttonLabel: 'Save',
    filters: [
      {
        name: 'xlsx file',
        extensions: ['xlsx'],
      }, ],
      properties: []
  }).then(file => {
    if (!file.canceled) {
      XLSX.writeFile(wb, file.filePath.toString());
    }
  });

});