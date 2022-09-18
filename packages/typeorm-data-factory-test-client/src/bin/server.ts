import http from 'http';

import app from '../index';

const server = http.createServer(app);

server.listen(3000);
