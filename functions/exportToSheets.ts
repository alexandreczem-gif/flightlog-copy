import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { entity_name, title, filters } = await req.json();

        if (!entity_name || !title) {
            return Response.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Get Google Sheets access token
        const accessToken = await base44.asServiceRole.connectors.getAccessToken('googlesheets');

        // Fetch entity data
        let data;
        if (filters && Object.keys(filters).length > 0) {
            data = await base44.asServiceRole.entities[entity_name].filter(filters);
        } else {
            data = await base44.asServiceRole.entities[entity_name].list('-created_date', 1000);
        }

        if (data.length === 0) {
            return Response.json({ error: 'No data to export' }, { status: 400 });
        }

        // Create spreadsheet
        const createResponse = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                properties: {
                    title: `${title} - ${new Date().toLocaleDateString('pt-BR')}`
                },
                sheets: [{
                    properties: {
                        title: 'Dados'
                    }
                }]
            })
        });

        if (!createResponse.ok) {
            const error = await createResponse.text();
            console.error('Error creating spreadsheet:', error);
            return Response.json({ error: 'Failed to create spreadsheet' }, { status: 500 });
        }

        const newSpreadsheet = await createResponse.json();
        const spreadsheetId = newSpreadsheet.spreadsheetId;

        // Get all unique keys from data
        const allKeys = new Set();
        data.forEach(item => {
            Object.keys(item).forEach(key => allKeys.add(key));
        });
        const headers = Array.from(allKeys);

        // Prepare rows
        const rows = [
            headers,
            ...data.map(item => headers.map(key => {
                const value = item[key];
                if (value === null || value === undefined) return '';
                if (Array.isArray(value)) return JSON.stringify(value);
                if (typeof value === 'object') return JSON.stringify(value);
                return String(value);
            }))
        ];

        // Append data
        const appendResponse = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Dados!A1:append?valueInputOption=RAW`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                values: rows
            })
        });

        if (!appendResponse.ok) {
            const error = await appendResponse.text();
            console.error('Error appending data:', error);
            return Response.json({ error: 'Failed to append data to spreadsheet' }, { status: 500 });
        }

        return Response.json({ 
            success: true,
            spreadsheetId,
            spreadsheetUrl: newSpreadsheet.spreadsheetUrl,
            rowCount: data.length,
            message: `${data.length} registros exportados com sucesso`
        });

    } catch (error) {
        console.error('Error in exportToSheets:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});