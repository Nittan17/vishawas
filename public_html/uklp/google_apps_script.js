/* 
   v5.0 SUPER SIMPLE ROBUST SCRIPT
   - No "setup" needed.
   - Automatically finds your sheet.
   
   DEPLOYMENT STEPS:
   1. Delete all old code. Paste this.
   2. Save.
   3. Click Deploy > New Deployment.
   4. Select "Web App".
   5. Execute as: "Me".
   6. Who has access: "Anyone".
   7. Copy the URL.
*/

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    // 1. Get the Spreadsheet directly
    var doc = SpreadsheetApp.getActiveSpreadsheet();
    
    // 2. Try to get "Sheet1", OR just get the first sheet if "Sheet1" is missing
    var sheet = doc.getSheetByName("Sheet1") || doc.getSheets()[0];

    // 3. Define headers explicitly
    var headers = [
      "Timestamp",
      "name",
      "email",
      "mobile",
      "city",
      "planning_time",
      "qualification",
      "refusal",
      "gap",
      "visa_type",
      "utm_campaign",
      "utm_adset",
      "event_name"
    ];

    // 4. Map incoming data
    var newRow = headers.map(function(header) {
      if (header === 'Timestamp') {
        return new Date();
      }
      return e.parameter[header] || "";
    });

    // 5. Append
    sheet.appendRow(newRow);

    return ContentService
      .createTextOutput(JSON.stringify({ "result": "success", "row": newRow }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (e) {
    return ContentService
      .createTextOutput(JSON.stringify({ "result": "error", "error": e.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}
