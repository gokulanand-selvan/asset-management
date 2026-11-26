import 'dotenv/config';
import path from 'node:path';
import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import pug from 'pug';
import { sequelize } from './models';
import routes from './routes';
import { formatCurrency, formatStatusLabel, toNumber } from './utils/helpers';

export function createApp(): express.Application {
  const app = express();

  // Register Pug engine under .jade extension to satisfy Jade template stack
  app.engine('jade', pug.__express);
  app.set('view engine', 'jade');
  app.set('views', path.join(__dirname, 'views'));

  app.use(cors());
  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());

  // Static assets & vendored frontend libraries (Bootstrap, DataTables, jQuery, Icons)
  app.use(express.static(path.join(__dirname, 'public')));
  app.use(
    '/vendor/bootstrap',
    express.static(path.join(__dirname, 'node_modules/bootstrap/dist'))
  );
  app.use(
    '/vendor/bootstrap-icons',
    express.static(path.join(__dirname, 'node_modules/bootstrap-icons/font'))
  );
  app.use(
    '/vendor/jquery',
    express.static(path.join(__dirname, 'node_modules/jquery/dist'))
  );
  app.use(
    '/vendor/datatables',
    express.static(path.join(__dirname, 'node_modules/datatables.net/js'))
  );
  app.use(
    '/vendor/datatables-bs5',
    express.static(path.join(__dirname, 'node_modules/datatables.net-bs5'))
  );

  // Template helpers and alert banner extraction
  app.use((req: Request, res: Response, next: NextFunction) => {
    res.locals.formatCurrency = formatCurrency;
    res.locals.formatStatusLabel = formatStatusLabel;
    res.locals.toNumber = toNumber;
    res.locals.alert =
      req.query.alertMsg && typeof req.query.alertMsg === 'string'
        ? {
            type:
              typeof req.query.alertType === 'string'
                ? req.query.alertType
                : 'info',
            message: req.query.alertMsg,
          }
        : null;
    next();
  });

  app.use('/', routes);

  // 404 handler
  app.use((req: Request, res: Response) => {
    res.status(404).render('error', {
      title: 'Page Not Found',
      activePage: '',
      statusCode: 404,
      message: `The requested page "${req.originalUrl}" was not found.`,
    });
  });

  // Error handler
  app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
    console.error('Unhandled error:', err);
    res.status(500).render('error', {
      title: 'Server Error',
      activePage: '',
      statusCode: 500,
      message: err.message || 'An unexpected error occurred.',
    });
  });

  return app;
}

async function startServer(): Promise<void> {
  const port = Number(process.env.PORT) || 3000;
  await sequelize.authenticate();
  await sequelize.sync();
  console.log('Connected to PostgreSQL and synchronized Sequelize models.');

  const app = createApp();
  app.listen(port, () => {
    console.log(`Asset Management server running at http://localhost:${port}`);
  });
}

if (require.main === module) {
  startServer().catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}
