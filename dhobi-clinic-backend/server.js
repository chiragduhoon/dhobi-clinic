require('dotenv').config();
const app = require('./src/app');
const { initFirebase } = require('./src/config/firebase');

initFirebase();

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Dhobi Clinic server running on port ${PORT}`);
});
