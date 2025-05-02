# colquator
cluster microservices

Arquitectura
project-root/
├── service1/
│   ├── src/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   └── index.js
│   ├── tests/
│   ├── config/
│   ├── Dockerfile
│   ├── package.json
│   └── README.md
├── service2/
│   ├── src/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   └── index.js
│   ├── tests/
│   ├── config/
│   ├── Dockerfile
│   ├── package.json
│   └── README.md
├── gateway/
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   └── index.js
│   ├── tests/
│   ├── config/
│   ├── Dockerfile
│   ├── package.json
│   └── README.md
├── common/
│   ├── middleware/
│   ├── utils/
│   └── config/
├── docker-compose.yml
└── README.md