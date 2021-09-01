import 'zone.js/dist/zone-node';

import { createProxyMiddleware } from 'http-proxy-middleware';
import { ngExpressEngine } from '@nguniversal/express-engine';
import * as express from 'express';
import { AppServerModule } from './src/main.server';
import { APP_BASE_HREF } from '@angular/common';
import * as path from 'path';
import * as fs from 'fs';
import * as proxy from 'express-http-proxy';

const bodyParser = require('body-parser');

// The Express app is exported so that it can be used by serverless Functions.
export function app(): any {
  const server = express();
  const distFolder = process.env.DIST || path.join(process.cwd(), 'dist', 'voting-box');
  console.log('distFolder', distFolder);
  const indexHtml = 'index';
  // Our Universal express-engine (found @ https://github.com/angular/universal/tree/master/modules/express-engine)
  server.engine('html', ngExpressEngine({
    bootstrap: AppServerModule,
  }));
  const urlencodedParser = bodyParser.urlencoded({extended: false});
  server.set('view engine', 'html');
  server.set('views', distFolder);

  // TODO hmmm
  server.use('/api', proxy('http://e-vote.dev.infra.loc', {
    proxyReqPathResolver:  (req): any => {
      return '/api' + req.url;
    }
  }));
   // Serve static files from /browser
  server.get('*.*', express.static(distFolder));

  // All regular routes use the Universal engine
  server.all('*', urlencodedParser, (req, res) => {
    console.log('request', req.method, req.url, 'with base', req.baseUrl);
    res.render(indexHtml, {
      req,
      res,
      providers: [
        {
          provide: APP_BASE_HREF,
          useValue: req.baseUrl
        },
        {
          provide: 'path',
          useValue: path,
        },
        {
          provide: 'fs',
          useValue: fs,
        },
      ]
    });
  });
  return server;
}

function run(): void {
  const port = process.env.PORT || 4000;

  // Start up the Node server
  const server = app();
  server.listen(port, () => {
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

// Webpack will replace 'require' with '__webpack_require__'
// '__non_webpack_require__' is a proxy to Node 'require'
// The below code is to ensure that the server is run only when not requiring the bundle.
declare const __non_webpack_require__: NodeRequire;
const mainModule = __non_webpack_require__.main;
const moduleFilename = mainModule && mainModule.filename || '';
if (moduleFilename === __filename || moduleFilename.includes('iisnode')) {
  run();
}

export * from './src/main.server';
