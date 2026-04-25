import dotenv from 'dotenv';
import app from './app.js';
import { inicializarEsquema } from './db/initSchema.js';

dotenv.config();

const port = Number(process.env.PORT || 3000);

async function iniciarServidor() {
  try {
    await inicializarEsquema();
    app.listen(port, () => {
      console.log(`Servidor ejecutandose en http://localhost:${port}`);
    });
  } catch (error) {
    console.error('No se pudo inicializar el esquema de la base de datos:', error);
    process.exit(1);
  }
}

iniciarServidor();
