import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { form_id, form_name, response_data } = await req.json();

        if (!form_id || !form_name || !response_data) {
            return Response.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Get Google Sheets access token
        const accessToken = await base44.asServiceRole.connectors.getAccessToken('googlesheets');

        // Get or create spreadsheet for this form
        const forms = await base44.asServiceRole.entities.Form.filter({ id: form_id });
        if (forms.length === 0) {
            return Response.json({ error: 'Form not found' }, { status: 404 });
        }

        const form = forms[0];
        let spreadsheetId = form.spreadsheet_id;

        // Create spreadsheet if it doesn't exist
        if (!spreadsheetId) {
            const createResponse = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    properties: {
                        title: `${form_name} - Respostas`
                    },
                    sheets: [{
                        properties: {
                            title: 'Respostas'
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
            spreadsheetId = newSpreadsheet.spreadsheetId;

            // Save spreadsheet ID to form
            await base44.asServiceRole.entities.Form.update(form_id, {
                spreadsheet_id: spreadsheetId,
                spreadsheet_url: newSpreadsheet.spreadsheetUrl
            });

            // Create headers
            const headers = ['Data de Envio', 'Enviado por', ...form.fields.map(f => f.label)];
            await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Respostas!A1:append?valueInputOption=RAW`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    values: [headers]
                })
            });
        }

        // Append response data
        const timestamp = new Date().toLocaleString('pt-BR');
        const userName = user.full_name || user.nome_de_guerra || user.email;
        const rowData = [
            timestamp,
            userName,
            ...form.fields.map(f => response_data[f.id] || '')
        ];

        const appendResponse = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Respostas!A:append?valueInputOption=RAW`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                values: [rowData]
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
            message: 'Resposta sincronizada com Google Sheets'
        });

    } catch (error) {
        console.error('Error in syncFormToSheets:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});