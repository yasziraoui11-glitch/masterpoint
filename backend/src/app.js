const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yaml');
const fs = require('fs');
const path = require('path');

const requestId = require('./middleware/requestId');
const { httpLogger } = require('./middleware/logger');
const errorHandler = require('./middleware/errorHandler');

const authRoutes = require('./routes/authRoutes');
const kundenRoutes = require('./routes/kundenRoutes');
const servicesRoutes = require('./routes/servicesRoutes');
const termineRoutes = require('./routes/termineRoutes');
const reportsRoutes = require('./routes/reportsRoutes');

const { prisma } = require('./db/prisma');

function buildApp() {
  const app = express();

  app.use(requestId);
  app.use(httpLogger());
  app.use(cors());
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(compression());
  app.use(express.json({ limit: '1mb' }));

  app.use(rateLimit({
    windowMs: 60 * 1000,
    limit: 300,
    standardHeaders: true,
    legacyHeaders: false,
  }));

    // ===== OpenAPI / Swagger =====
  const openapiPath = path.join(__dirname, '..', 'docs', 'openapi.yaml');

  if (fs.existsSync(openapiPath)) {
    const raw = fs.readFileSync(openapiPath, 'utf-8');
    const spec = YAML.parse(raw);

    // Spec endpoints (useful for debugging / reverse proxy setups)
    app.get('/openapi.yaml', (req, res) => res.type('text/yaml').send(raw));
    app.get('/openapi.json', (req, res) => res.json(spec));

    // Swagger UI loads the spec from /openapi.json (deterministic)
    app.use(
      '/docs',
      swaggerUi.serve,
      swaggerUi.setup(null, {
        swaggerOptions: { url: '/openapi.json' },
      })
    );
  }

app.get('/health', (req,res)=>res.json({ ok:true }));
  app.get('/ready', async (req,res)=>{
    try { await prisma.$queryRaw`SELECT 1`; res.json({ ok:true }); }
    catch { res.status(503).json({ ok:false }); }
  });

  app.use('/auth', authRoutes);
  app.use('/kunden', kundenRoutes);
  app.use('/services', servicesRoutes);
  app.use('/termine', termineRoutes);
  app.use('/reports', reportsRoutes);

  app.use((req,res)=>res.status(404).json({ error:'Route nicht gefunden', requestId:req.requestId }));
  app.use(errorHandler);
  return app;
}

module.exports = { buildApp };
