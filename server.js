// server.js

// -----------------------------------------------------------------------------
// 1. IMPORTACIÓN DE MÓDULOS
// -----------------------------------------------------------------------------
const express = require('express');
const axios = require('axios');

// -----------------------------------------------------------------------------
// 2. CONFIGURACIÓN
// -----------------------------------------------------------------------------
const app = express();
app.use(express.json());

// Cloud Run proporciona la variable PORT. Usamos 8080 como fallback.
const PORT = process.env.PORT || 8080; 

// --- Lectura de credenciales desde variables de entorno ---
// Esto es más seguro y flexible para producción.
// Configuraremos estas variables directamente en Google Cloud Run.
const JUMPSeller_LOGIN = process.env.JUMPSELLER_LOGIN;
const JUMPSeller_TOKEN = process.env.JUMPSELLER_TOKEN;

// -----------------------------------------------------------------------------
// 3. LÓGICA DE NEGOCIO
// -----------------------------------------------------------------------------

/**
 * Calcula la fecha de retiro sumando N días hábiles a una fecha dada.
 * No considera feriados, solo fines de semana (sábado y domingo).
 * @param {Date} fechaInicio - La fecha desde la cual empezar a contar.
 * @param {number} diasHabiles - El número de días hábiles a sumar.
 * @returns {Date} La fecha de retiro calculada.
 */
function calcularFechaRetiro(fechaInicio, diasHabiles = 3) {
    let diasSumados = 0;
    const fecha = new Date(fechaInicio);

    while (diasSumados < diasHabiles) {
        fecha.setDate(fecha.getDate() + 1);
        const diaDeLaSemana = fecha.getDay(); // 0 = Domingo, ..., 6 = Sábado

        if (diaDeLaSemana !== 0 && diaDeLaSemana !== 6) {
            diasSumados++;
        }
    }
    return fecha;
}

// -----------------------------------------------------------------------------
// 4. ENDPOINT DEL WEBHOOK
// -----------------------------------------------------------------------------
app.post('/webhook/pedido-creado', async (req, res) => {
    // Verificación inicial de credenciales
    if (!JUMPSeller_LOGIN || !JUMPSeller_TOKEN) {
        console.error('Error crítico: Las variables de entorno JUMPSELLER_LOGIN y JUMPSELLER_TOKEN no están configuradas.');
        return res.status(500).send('Error de configuración del servidor.');
    }

    console.log('¡Webhook de nuevo pedido recibido!');
    // LÍNEA AÑADIDA PARA DEPURACIÓN:
    console.log('Cuerpo del webhook recibido:', JSON.stringify(req.body, null, 2));
    
    // Validar que el cuerpo del webhook y el pedido existen
    if (!req.body || !req.body.order || !req.body.order.id) {
        console.error('Error: Webhook con formato inválido o sin ID de pedido.');
        return res.status(400).send('Webhook con formato inválido.');
    }

    const orderId = req.body.order.id;
    console.log(`Procesando pedido ID: ${orderId}`);

    try {
        const fechaPedido = new Date(req.body.order.created_at);
        const fechaRetiro = calcularFechaRetiro(fechaPedido, 3);
        const fechaRetiroFormateada = fechaRetiro.toLocaleDateString('es-CL');
        
        console.log(`Fecha de retiro calculada: ${fechaRetiroFormateada}`);

        const apiUrl = `https://api.jumpseller.com/v1/orders/${orderId}.json`;
        
        const payload = {
            order: {
                status: 'listo para retirar en tienda',
                shipping_status_notes: `Tu pedido estará listo para ser retirado a partir del ${fechaRetiroFormateada}.`
            }
        };

        const auth = {
            username: JUMPSeller_LOGIN,
            password: JUMPSeller_TOKEN
        };

        console.log(`Actualizando estado del pedido ${orderId} en Jumpseller...`);
        await axios.put(apiUrl, payload, { auth });
        console.log(`¡Éxito! El pedido ${orderId} fue actualizado.`);
        
        res.status(200).send('Webhook procesado exitosamente.');

    } catch (error) {
        console.error(`Error al procesar el pedido ${orderId}:`, error.response ? error.response.data : error.message);
        res.status(500).send('Error interno del servidor.');
    }
});

// -----------------------------------------------------------------------------
// 5. INICIAR SERVIDOR
// -----------------------------------------------------------------------------
app.listen(PORT, () => {
    console.log(`Servidor de notificaciones escuchando en el puerto ${PORT}`);
});
