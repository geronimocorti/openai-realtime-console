// server.js

import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';

const app = express();
const PORT = 8080; // Puerto en el que correrá tu servidor

// Middleware para habilitar CORS
app.use(cors());

// Endpoint para manejar la solicitud de tu aplicación React
app.get('/api/query', async (req, res) => {
  const { question } = req.query; // Obtiene la pregunta de los parámetros de la consulta
  try {
    const response = await fetch(
      `http://dembed.us-east-1.despegar.net/document/UGa-u5ABeI0nFQTbLH5c/query?limit=6&filter=product_types:flight&text=${question}`,
      {
        headers: {
          'Content-Type': 'application/json',
          'x-client': 'gcorti',
          'x-uow': 'gcorti-prueba-gpt-real-api-123',
        },
      }
    );

    // Verifica si la respuesta es exitosa
    if (!response.ok) {
      throw new Error('Error en la solicitud de la API externa');
    }

    const json = await response.json();
    res.json(json); // Devuelve el resultado a la aplicación React
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Algo salió mal al procesar la solicitud' });
  }
});

// Inicia el servidor
app.listen(PORT, () => {
  console.log(`Servidor proxy escuchando en http://localhost:${PORT}`);
});