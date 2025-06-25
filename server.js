// server.js (Versión 1 - Recepción Segura de Webhooks)

const express = require('express');
const crypto = require('crypto'); // Módulo de Node.js para criptografía

const app = express();

// --- Lectura de Secretos como Variables de Entorno ---
// Estos valores se inyectan de forma segura desde Secret Manager via cloudbuild.yaml
const JUMPSELLER_HOOKS_TOKEN = process.env.JUMPSELLER_HOOKS_TOKEN;
const JUMPSELLER_LOGIN = process.env.JUMPSELLER_LOGIN;
const JUMPSELLER_TOKEN = process.env.JUMPSELLER_TOKEN;

// Middleware para leer el cuerpo de la petición como JSON.
// La función 'verify' es crucial para capturar el cuerpo en su estado crudo (raw),
// lo cual es indispensable para poder verificar la firma HMAC.
app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));

const PORT = process.env.PORT || 8080;

// --- ENDPOINT DEL WEBHOOK ---
// Esta es la URL que configurarás en Jumpseller.
app.post('/webhook/pedido-creado', (req, res) => {

    // Verificación #1: Asegurarnos que el token secreto del servidor está cargado.
    if (!JUMPSELLER_HOOKS_TOKEN) {
        console.error('Error Crítico: La variable de entorno JUMPSELLER_HOOKS_TOKEN no está configurada.');
        return res.status(500).send('Error de configuración del servidor.');
    }

    // Verificación #2: Seguridad de la firma del Webhook.
    // Jumpseller firma el cuerpo de la petición con tu 'hooks_token' y lo envía en la cabecera 'X-Jumpseller-Hmac-Sha256'.
    // Nosotros debemos replicar esa firma y compararla. Si no coinciden, la petición es descartada.
    const hmacHeader = req.get('X-Jumpseller-Hmac-Sha256');
    const digest = crypto
        .createHmac('sha256', JUMPSELLER_HOOKS_TOKEN)
        .update(req.rawBody)
        .digest('hex');

    if (hmacHeader !== digest) {
        console.error('ALERTA DE SEGURIDAD: Se recibió un webhook con una firma HMAC inválida.');
        return res.status(401).send('Firma inválida.'); // 401 Unauthorized
    }

    // Si ambas verificaciones pasan, el webhook es auténtico y seguro.
    const eventType = req.get('X-Jumpseller-Event');
    console.log(`Webhook verificado y recibido con éxito. Evento: ${eventType}`);
    console.log('Datos del pedido:', JSON.stringify(req.body, null, 2));
    
    // Aquí, en el futuro, añadiremos la lógica para actualizar el pedido usando JUMPSELLER_LOGIN y JUMPSELLER_TOKEN.
    
    res.status(200).send('Webhook recibido y verificado.');
});

// --- INICIAR SERVIDOR ---
app.listen(PORT, () => {
    console.log(`Servidor de webhooks escuchando en el puerto ${PORT}`);
});
