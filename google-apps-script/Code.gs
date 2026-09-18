// INDSIL Damper Monitor — Google Apps Script
//
// Deploy as a Web App. This version rejects repeated consecutive statuses,
// even if a sender retries, reboots, or an old ESP32 sketch posts repeatedly.
// Sheet columns: A = Date, B = Time, C = Status (ON/OFF).
// New records are inserted at row 2, immediately beneath the header row.

function jsonResponse(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var action = (e && e.parameter && e.parameter.action) || 'read';

  if (action === 'read') {
    var lastRow = sheet.getLastRow();
    if (lastRow < 2) return jsonResponse({ success: true, data: [] });

    var values = sheet.getRange(2, 1, lastRow - 1, 3).getDisplayValues();
    return jsonResponse({
      success: true,
      data: values.map(function (row) {
        return { date: row[0], time: row[1], status: row[2] };
      })
    });
  }

  if (action !== 'write') {
    return jsonResponse({ success: false, error: 'Invalid action' });
  }

  var status = String((e && e.parameter && e.parameter.status) || '').trim().toUpperCase();
  if (status !== 'ON' && status !== 'OFF') {
    return jsonResponse({ success: false, error: 'Invalid status. Use ON or OFF.' });
  }

  // Prevent two concurrent requests from both reading the same prior row and
  // appending duplicate values at the same time.
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);

    var lastRow = sheet.getLastRow();
    if (lastRow >= 2) {
      // Row 2 is the newest event because each write is inserted there.
      var previousStatus = String(sheet.getRange(2, 3).getDisplayValue()).trim().toUpperCase();
      if (previousStatus === status) {
        return jsonResponse({
          success: true,
          uploaded: false,
          ignored: true,
          confirmation: 'No upload required; this status is already the latest record.',
          status: status
        });
      }
    }

    var now = new Date();
    var timezone = Session.getScriptTimeZone();
    var date = Utilities.formatDate(now, timezone, 'dd-MM-yyyy');
    var time = Utilities.formatDate(now, timezone, 'HH:mm:ss');

    // Preserve row 1 as the column header and place the newest event first.
    sheet.insertRowBefore(2);
    sheet.getRange(2, 1, 1, 3).setValues([[date, time, status]]);
    return jsonResponse({
      success: true,
      uploaded: true,
      ignored: false,
      confirmation: 'Damper status uploaded successfully.',
      date: date,
      time: time,
      status: status
    });
  } catch (error) {
    return jsonResponse({ success: false, error: 'Write failed: ' + error.message });
  } finally {
    if (lock.hasLock()) lock.releaseLock();
  }
}
