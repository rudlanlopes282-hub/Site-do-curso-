export default async function handler(req, res) {
    // Permitir requisições do seu próprio site
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,GET');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método não permitido' });
    }

    const { amount, description, payer } = req.body;

    const CLIENT_ID = 'f21ac055-5506-4b0d-b357-2b0626a5ed26';
    const CLIENT_SECRET = '05e92b53-a025-4cab-b1be-269f0aa46226';

    try {
        // 1. Obter Token OAuth na SyncPay
        const tokenResponse = await fetch('https://api.syncpay.com.br/oauth/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ clientId: CLIENT_ID, clientSecret: CLIENT_SECRET })
        });
        
        const tokenData = await tokenResponse.json();
        const accessToken = tokenData.access_token || tokenData.token;

        if (!accessToken) {
            return res.status(400).json({ error: 'Falha na autenticação com a SyncPay', details: tokenData });
        }

        // 2. Criar a Cobrança Pix
        const pixResponse = await fetch('https://api.syncpay.com.br/v1/pix/charge', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify({
                amount: amount,
                description: description,
                payer: payer
            })
        });

        const pixData = await pixResponse.json();
        return res.status(200).json(pixData);

    } catch (error) {
        console.error('Erro na API:', error);
        return res.status(500).json({ error: 'Erro interno ao gerar o Pix', details: error.message });
    }
}
