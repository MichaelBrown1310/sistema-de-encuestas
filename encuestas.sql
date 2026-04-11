CREATE DATABASE IF NOT EXISTS encuestas
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE encuestas;

CREATE TABLE IF NOT EXISTS usuarios (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(120) NOT NULL,
  correo VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

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
);

CREATE TABLE IF NOT EXISTS preguntas (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  encuesta_id INT UNSIGNED NOT NULL,
  enunciado VARCHAR(255) NOT NULL,
  tipo ENUM('texto', 'opcion_unica', 'opcion_multiple') NOT NULL DEFAULT 'texto',
  orden INT UNSIGNED NOT NULL DEFAULT 1,
  CONSTRAINT fk_preguntas_encuesta
    FOREIGN KEY (encuesta_id) REFERENCES encuestas(id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS opciones_pregunta (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  pregunta_id INT UNSIGNED NOT NULL,
  texto VARCHAR(180) NOT NULL,
  orden INT UNSIGNED NOT NULL DEFAULT 1,
  CONSTRAINT fk_opciones_pregunta
    FOREIGN KEY (pregunta_id) REFERENCES preguntas(id)
    ON DELETE CASCADE
);

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
);

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
);
