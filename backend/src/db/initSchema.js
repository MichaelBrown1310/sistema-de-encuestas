import pool from '../db.js';

async function existeTabla(nombreTabla) {
  const [filas] = await pool.query(
    `
    SELECT COUNT(*) AS total
    FROM information_schema.tables
    WHERE table_schema = DATABASE() AND table_name = ?
    `,
    [nombreTabla]
  );

  return Number(filas[0]?.total || 0) > 0;
}

async function existeColumna(nombreTabla, nombreColumna) {
  const [filas] = await pool.query(
    `
    SELECT COUNT(*) AS total
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = ?
      AND column_name = ?
    `,
    [nombreTabla, nombreColumna]
  );

  return Number(filas[0]?.total || 0) > 0;
}

async function existeRestriccion(nombreTabla, nombreRestriccion) {
  const [filas] = await pool.query(
    `
    SELECT COUNT(*) AS total
    FROM information_schema.table_constraints
    WHERE table_schema = DATABASE()
      AND table_name = ?
      AND constraint_name = ?
    `,
    [nombreTabla, nombreRestriccion]
  );

  return Number(filas[0]?.total || 0) > 0;
}

export async function inicializarEsquema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      nombre VARCHAR(120) NOT NULL,
      correo VARCHAR(150) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS encuestas (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      usuario_id INT UNSIGNED NOT NULL,
      titulo VARCHAR(180) NOT NULL,
      descripcion TEXT NOT NULL,
      categoria VARCHAR(120) NOT NULL,
      estado ENUM('borrador', 'publicada') NOT NULL DEFAULT 'borrador',
      fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_encuestas_usuario
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
        ON DELETE CASCADE
    )
  `);

  if (!(await existeColumna('encuestas', 'imagen_portada'))) {
    await pool.query('ALTER TABLE encuestas ADD COLUMN imagen_portada LONGTEXT NULL AFTER descripcion');
  }

  if (!(await existeColumna('encuestas', 'mensaje_confirmacion'))) {
    await pool.query(`
      ALTER TABLE encuestas
      ADD COLUMN mensaje_confirmacion TEXT NOT NULL
      DEFAULT 'Tu respuesta ha sido enviada correctamente.'
      AFTER estado
    `);
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS secciones (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      encuesta_id INT UNSIGNED NOT NULL,
      titulo VARCHAR(180) NOT NULL,
      descripcion TEXT NULL,
      orden INT UNSIGNED NOT NULL DEFAULT 1,
      CONSTRAINT fk_secciones_encuesta
        FOREIGN KEY (encuesta_id) REFERENCES encuestas(id)
        ON DELETE CASCADE
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS preguntas (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      encuesta_id INT UNSIGNED NOT NULL,
      enunciado VARCHAR(255) NOT NULL,
      tipo ENUM('texto', 'opcion_unica', 'opcion_multiple') NOT NULL DEFAULT 'texto',
      orden INT UNSIGNED NOT NULL DEFAULT 1,
      CONSTRAINT fk_preguntas_encuesta
        FOREIGN KEY (encuesta_id) REFERENCES encuestas(id)
        ON DELETE CASCADE
    )
  `);

  if (!(await existeColumna('preguntas', 'seccion_id'))) {
    await pool.query('ALTER TABLE preguntas ADD COLUMN seccion_id INT UNSIGNED NULL AFTER encuesta_id');
  }

  if (!(await existeColumna('preguntas', 'imagen'))) {
    await pool.query('ALTER TABLE preguntas ADD COLUMN imagen LONGTEXT NULL AFTER enunciado');
  }

  if (!(await existeColumna('preguntas', 'es_obligatoria'))) {
    await pool.query(`
      ALTER TABLE preguntas
      ADD COLUMN es_obligatoria TINYINT(1) NOT NULL DEFAULT 1
      AFTER tipo
    `);
  }

  const tieneSeccionSinAsignar = !(await existeRestriccion('preguntas', 'fk_preguntas_seccion'));

  if (tieneSeccionSinAsignar) {
    await pool.query(`
      INSERT INTO secciones (encuesta_id, titulo, descripcion, orden)
      SELECT e.id, 'Seccion principal', NULL, 1
      FROM encuestas e
      WHERE NOT EXISTS (
        SELECT 1 FROM secciones s WHERE s.encuesta_id = e.id
      )
    `);

    await pool.query(`
      UPDATE preguntas p
      INNER JOIN secciones s ON s.encuesta_id = p.encuesta_id AND s.orden = 1
      SET p.seccion_id = s.id
      WHERE p.seccion_id IS NULL
    `);

    await pool.query('ALTER TABLE preguntas MODIFY COLUMN seccion_id INT UNSIGNED NOT NULL');
    await pool.query(`
      ALTER TABLE preguntas
      ADD CONSTRAINT fk_preguntas_seccion
      FOREIGN KEY (seccion_id) REFERENCES secciones(id)
      ON DELETE CASCADE
    `);
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS opciones_pregunta (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      pregunta_id INT UNSIGNED NOT NULL,
      texto VARCHAR(180) NOT NULL,
      orden INT UNSIGNED NOT NULL DEFAULT 1,
      CONSTRAINT fk_opciones_pregunta
        FOREIGN KEY (pregunta_id) REFERENCES preguntas(id)
        ON DELETE CASCADE
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS respuestas (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      encuesta_id INT UNSIGNED NOT NULL,
      usuario_id INT UNSIGNED NOT NULL,
      fecha_respuesta TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_respuestas_encuesta
        FOREIGN KEY (encuesta_id) REFERENCES encuestas(id)
        ON DELETE CASCADE,
      CONSTRAINT fk_respuestas_usuario
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
        ON DELETE CASCADE
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS detalle_respuestas (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      respuesta_id INT UNSIGNED NOT NULL,
      pregunta_id INT UNSIGNED NOT NULL,
      opcion_id INT UNSIGNED NULL,
      texto_respuesta TEXT NULL,
      CONSTRAINT fk_detalle_respuesta
        FOREIGN KEY (respuesta_id) REFERENCES respuestas(id)
        ON DELETE CASCADE,
      CONSTRAINT fk_detalle_pregunta
        FOREIGN KEY (pregunta_id) REFERENCES preguntas(id)
        ON DELETE CASCADE,
      CONSTRAINT fk_detalle_opcion
        FOREIGN KEY (opcion_id) REFERENCES opciones_pregunta(id)
        ON DELETE CASCADE
    )
  `);
}
