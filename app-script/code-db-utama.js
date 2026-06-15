function doGet(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var table = e && e.parameter && e.parameter.table;

  if (table) {
    var sheet = ss.getSheetByName(table);
    if (!sheet) {
      return ContentService.createTextOutput(
        JSON.stringify({ error: "Table not found: " + table }),
      ).setMimeType(ContentService.MimeType.JSON);
    }

    var data = sheet.getDataRange().getValues();
    var headers = data.shift(); // Ambil header dari baris pertama
    var jsonData = data.map((row) => {
      let obj = {};
      headers.forEach((header, index) => {
        obj[header] = row[index];
      });
      return obj;
    });

    var filterCol = e && e.parameter && e.parameter.filter_col;
    var filterVal = e && e.parameter && e.parameter.filter_val;
    if (filterCol && filterVal) {
      var targetColClean = filterCol.toLowerCase().replace(/[^a-z0-9]/g, "");
      jsonData = jsonData.filter((obj) => {
        var actualKey = Object.keys(obj).find(function(k) {
          return k.toLowerCase().replace(/[^a-z0-9]/g, "") === targetColClean;
        });
        return (
          actualKey &&
          obj[actualKey] !== undefined &&
          String(obj[actualKey]).toLowerCase().includes(filterVal.toLowerCase())
        );
      });
    }

    return ContentService.createTextOutput(
      JSON.stringify(jsonData),
    ).setMimeType(ContentService.MimeType.JSON);
  }

  // Fallback: jika tidak ada parameter table, kembalikan daftar nama sheet
  var sheets = ss.getSheets();
  var sheetNames = sheets.map(function (s) {
    return s.getName();
  });
  return ContentService.createTextOutput(
    JSON.stringify({
      error: "Parameter 'table' is required",
      availableTables: sheetNames,
    }),
  ).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var result = {};

  try {
    var postData = JSON.parse(e.postData.contents);
    var table = postData.table;
    var data = postData.data; // objek berisi baris data rekap

    if (!table) {
      throw new Error("Parameter 'table' is required");
    }

    var sheet = ss.getSheetByName(table);
    if (!sheet) {
      // Buat sheet baru secara otomatis jika belum ada
      sheet = ss.insertSheet(table);
    }

    // Jika sheet baru dibuat atau tidak memiliki kolom header
    var lastRow = sheet.getLastRow();
    var headers = [];
    if (lastRow > 0) {
      headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    }

    // Ambil semua properti data sebagai kolom header potensial
    var keys = Object.keys(data);

    if (lastRow === 0) {
      // Sheet baru: tulis headers terlebih dahulu
      headers = keys;
      sheet.appendRow(headers);
      lastRow = 1;
    } else {
      // Sheet lama: periksa apakah ada header baru untuk ditambahkan ke kolom
      var headersUpdated = false;
      keys.forEach(function (key) {
        if (headers.indexOf(key) === -1) {
          headers.push(key);
          headersUpdated = true;
        }
      });
      if (headersUpdated) {
        sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      }
    }

    // Siapkan baris nilai berdasarkan susunan kolom header
    var rowValues = headers.map(function (header) {
      var val = data[header];
      return val !== undefined ? val : "";
    });

    sheet.appendRow(rowValues);

    result = { success: true, message: "Data successfully added to " + table };
  } catch (error) {
    result = { success: false, error: error.message };
  }

  return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(
    ContentService.MimeType.JSON,
  );
}
