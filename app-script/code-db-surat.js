// Code.gs - Updated Google Apps Script
function doGet(e) {
  const data = getTemplatesData();
  return ContentService.createTextOutput(data).setMimeType(
    ContentService.MimeType.JSON,
  );
}

function getTemplatesData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // Ambil data dari TemplatePath
  const pathSheet = ss.getSheetByName("TemplatePath");
  const pathData = pathSheet.getDataRange().getValues();
  const pathHeaders = pathData.shift();

  const templateMap = {};
  pathData.forEach((row) => {
    const rowObj = {};
    pathHeaders.forEach((key, i) => {
      rowObj[key.trim()] = row[i];
    });

    const suratType = rowObj["Surat Type"];
    templateMap[suratType] = {
      templatePath: rowObj["Template Path"],
      templateType: rowObj["Template Type"],
      placeholder: [],
    };
  });

  // Ambil data dari Placeholders
  const placeholderSheet = ss.getSheetByName("Placeholders");
  const placeholderData = placeholderSheet.getDataRange().getValues();
  const placeholderHeaders = placeholderData.shift();

  placeholderData.forEach((row) => {
    const rowObj = {};
    placeholderHeaders.forEach((key, i) => {
      rowObj[key.trim()] = row[i];
    });

    const suratType = rowObj["Surat Type"];
    if (templateMap[suratType]) {
      const placeholder = {
        key: rowObj["Key"],
        label: rowObj["Label"],
        type: rowObj["Type"],
      };

      // Tambahkan options jika type adalah select
      if (rowObj["Type"] === "select" && rowObj["Options"]) {
        // Parse options dari string "option1,option2,option3" menjadi array
        placeholder.options = rowObj["Options"]
          .split(",")
          .map((opt) => opt.trim())
          .filter((opt) => opt.length > 0);
      }

      // Tambahkan default value jika ada
      if (rowObj["Default"]) {
        placeholder.default = rowObj["Default"];
      }

      templateMap[suratType].placeholder.push(placeholder);
    }
  });

  return JSON.stringify(templateMap, null, 2);
}
