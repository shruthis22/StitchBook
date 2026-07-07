// --- CONFIGURATION ---
const SHEET_BILLS = 'Bills';
const SHEET_PRODUCTS = 'Products';

function doGet(e) {
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // Check URL parameter ?type=products or ?type=bills
    const type = e.parameter.type || 'bills';
    const sheetName = type === 'products' ? SHEET_PRODUCTS : SHEET_BILLS;

    const sheet = ss.getSheetByName(sheetName);

    if (!sheet) {
        return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Sheet not found' }))
            .setMimeType(ContentService.MimeType.JSON);
    }

    const data = sheet.getDataRange().getValues();
    // Handle empty sheet case
    if (data.length === 0) {
        return ContentService.createTextOutput(JSON.stringify([]))
            .setMimeType(ContentService.MimeType.JSON);
    }

    const headers = data[0];
    const rows = data.slice(1);

    const result = rows.map((row) => {
        let obj = {};
        headers.forEach((header, index) => {
            // Parse 'items' only if we are reading bills
            if (header === 'items' && row[index] && type === 'bills') {
                try {
                    obj[header] = JSON.parse(row[index]);
                } catch (e) {
                    obj[header] = [];
                }
            } else {
                obj[header] = row[index];
            }
        });
        return obj;
    }).reverse();

    return ContentService.createTextOutput(JSON.stringify(result))
        .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
    var lock = LockService.getScriptLock();
    lock.tryLock(10000);

    try {
        const ss = SpreadsheetApp.getActiveSpreadsheet();
        const body = JSON.parse(e.postData.contents);
        const action = body.action; // 'delete' or undefined (save)

        // Determine which sheet to write to based on a hidden flag
        // Default to Bills if not specified
        const type = body.type || body._sheetType || 'bills';
        const sheetName = type === 'products' ? SHEET_PRODUCTS : SHEET_BILLS;

        let sheet = ss.getSheetByName(sheetName);
        if (!sheet) {
            // Auto-create if missing (failsafe)
            sheet = ss.insertSheet(sheetName);
        }

        // --- HANDLE UPDATE ACTION ---
        if (action === 'update') {
            var rows = sheet.getDataRange().getValues();
            var headers = rows[0];
            var idToUpdate = String(body.id);
            var updates = body.updates || {};
            var rowIndexToUpdate = -1;

            for (var i = 1; i < rows.length; i++) {
                if (String(rows[i][0]) === idToUpdate) {
                    rowIndexToUpdate = i + 1;
                    break;
                }
            }

            if (rowIndexToUpdate > -1) {
                // Add any new column headers that don't exist yet
                var updateKeys = Object.keys(updates);
                var missingHeaders = updateKeys.filter(function (k) { return headers.indexOf(k) === -1; });
                if (missingHeaders.length > 0) {
                    var lastCol = headers.length;
                    missingHeaders.forEach(function (h, idx) {
                        sheet.getRange(1, lastCol + idx + 1).setValue(h);
                    });
                    headers = sheet.getDataRange().getValues()[0];
                }

                headers.forEach(function (header, colIndex) {
                    if (updates.hasOwnProperty(header)) {
                        var val = updates[header];
                        if (header === 'items') val = JSON.stringify(val);
                        sheet.getRange(rowIndexToUpdate, colIndex + 1).setValue(val === undefined || val === null ? '' : val);
                    }
                });

                return ContentService.createTextOutput(JSON.stringify({ status: 'success', message: 'Updated' }))
                    .setMimeType(ContentService.MimeType.JSON);
            } else {
                return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'ID not found' }))
                    .setMimeType(ContentService.MimeType.JSON);
            }
        }

        // --- HANDLE DELETE ACTION ---
        if (action === 'delete') {
            var rows = sheet.getDataRange().getValues();
            var idToDelete = String(body.id);
            var rowIndexToDelete = -1;

            // Find row by ID (Assuming ID is in column 0 - first column, which matches 'id' in headers)
            // We skip header, so start at 1
            for (var i = 1; i < rows.length; i++) {
                if (String(rows[i][0]) === idToDelete) {
                    rowIndexToDelete = i + 1; // 1-based index
                    break;
                }
            }

            if (rowIndexToDelete > -1) {
                sheet.deleteRow(rowIndexToDelete);
                return ContentService.createTextOutput(JSON.stringify({ status: 'success', message: 'Deleted' }))
                    .setMimeType(ContentService.MimeType.JSON);
            } else {
                return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'ID not found' }))
                    .setMimeType(ContentService.MimeType.JSON);
            }
        }

        // --- HANDLE SAVE ACTION (Default) ---
        var headers = sheet.getDataRange().getValues()[0];

        // Auto-add missing column headers from body (backward compatible)
        var bodyKeys = Object.keys(body).filter(function (k) {
            return k !== 'action' && k !== 'type' && k !== '_sheetType';
        });
        var missingSaveHeaders = bodyKeys.filter(function (k) { return headers.indexOf(k) === -1; });
        if (missingSaveHeaders.length > 0) {
            var lastCol = headers.length;
            missingSaveHeaders.forEach(function (h, idx) {
                sheet.getRange(1, lastCol + idx + 1).setValue(h);
            });
            headers = sheet.getDataRange().getValues()[0];
        }

        // Map body to headers
        const newRow = headers.map(header => {
            const value = body[header];
            if (header === 'items') return JSON.stringify(value);
            return value === undefined || value === null ? '' : value;
        });

        sheet.appendRow(newRow);

        return ContentService.createTextOutput(JSON.stringify({ status: 'success' }))
            .setMimeType(ContentService.MimeType.JSON);

    } catch (error) {
        return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: error.toString() }))
            .setMimeType(ContentService.MimeType.JSON);
    } finally {
        lock.releaseLock();
    }
}
