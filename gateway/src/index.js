const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

app.use('/vehicles', createProxyMiddleware({ target: 'http://localhost:3005', changeOrigin: true }));

// Configuración de seguridad
app.use((req, res, next) => {
  // Autenticación y autorización
  next();
});

app.listen(3000, () => {
  console.log('API Gateway en ejecución en el puerto 3000');
});