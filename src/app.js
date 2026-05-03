const express = require('express');
const cursosRoutes = require('./routes/cursos.routes');

const app = express();

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ ok: true, message: 'Servidor funcionando' });
});

app.use('/cursos', cursosRoutes);

app.use((error, req, res, next) => {
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
