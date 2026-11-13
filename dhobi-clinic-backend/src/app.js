require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const authRoutes = require('./modules/auth/auth.routes');
const bagsRoutes = require('./modules/bags/bags.routes');
const ordersRoutes = require('./modules/orders/orders.routes');
const itemsRoutes = require('./modules/items/items.routes');
const notificationsRoutes = require('./modules/notifications/notifications.routes');
const devicesRoutes = require('./modules/notifications/devices.routes');
const adminRoutes = require('./modules/admin/admin.routes');
const labelsRoutes = require('./modules/labels/labels.routes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/bags', bagsRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/items', itemsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/devices', devicesRoutes);
app.use('/api/admin', labelsRoutes);  // label PDF (before admin so .pdf paths resolve cleanly)
app.use('/api/admin', adminRoutes);

app.get('/health', (_, res) => res.json({ status: 'ok', version: 'v2' }));

app.use(errorHandler);

module.exports = app;
