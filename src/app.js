const express = require('express');
const path = require('path');
const cursosRoutes = require('./routes/cursos.routes');
const inscripcionesRoutes = require('./routes/inscripciones.routes');

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

app.get('/health', (req, res) => {
  res.json({ ok: true, message: 'Servidor funcionando' });
});

app.get('/', (req, res) => {
  res.redirect('/pages/dashboard.html');
});

app.get('/cursos', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/pages/cursos.html'));
});

app.use('/api/cursos', cursosRoutes);
// TODO: proteger con verificarJWT cuando este lista la autenticacion.
app.use('/api/inscripciones', inscripcionesRoutes);

app.use((error, req, res, next) => {
  console.error('ERROR REAL:', error);

  const status = error.status || 500;
  res.status(status).json({
    ok: false,
    message: error.message || 'Error interno del servidor',
  });
});

const PORT = Number(process.env.PORT || 3000);

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Servidor escuchando en puerto ${PORT}`);
  });
}

module.exports = app;
