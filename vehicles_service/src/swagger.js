const swaggerJSDoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Vehicles Service API",
      version: "1.0.0",
      description: "API documentation for the Vehicles Service",
    },
    servers: [
      {
        url: "http://localhost:3005", // Cambia el puerto si es necesario
      },
    ],
  },
  apis: ["./src/routes/*.js"], // Path to the API docs
};

const swaggerSpec = swaggerJSDoc(options);
module.exports = swaggerSpec;
