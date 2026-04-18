SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS detalle_respuestas;
DROP TABLE IF EXISTS respuestas;
DROP TABLE IF EXISTS opciones_pregunta;
DROP TABLE IF EXISTS preguntas;
DROP TABLE IF EXISTS secciones;
DROP TABLE IF EXISTS encuestas;
DROP TABLE IF EXISTS usuarios;

SET FOREIGN_KEY_CHECKS = 1;

CREATE DATABASE IF NOT EXISTS encuestas
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE encuestas;

CREATE TABLE usuarios (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  nombre VARCHAR(120) NOT NULL,
  correo VARCHAR(150) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_usuarios_correo (correo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE encuestas (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  usuario_id INT UNSIGNED NOT NULL,
  titulo VARCHAR(180) NOT NULL,
  descripcion TEXT NOT NULL,
  imagen_portada MEDIUMTEXT NULL,
  categoria VARCHAR(120) NOT NULL,
  estado ENUM('borrador', 'publicada') NOT NULL DEFAULT 'borrador',
  mensaje_confirmacion TEXT NOT NULL DEFAULT 'Tu respuesta ha sido enviada correctamente.',
  fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY fk_encuestas_usuario (usuario_id),
  CONSTRAINT fk_encuestas_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE secciones (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  encuesta_id INT UNSIGNED NOT NULL,
  titulo VARCHAR(180) NOT NULL,
  descripcion TEXT NULL,
  orden INT UNSIGNED NOT NULL DEFAULT 1,
  PRIMARY KEY (id),
  UNIQUE KEY uk_secciones_encuesta_orden (encuesta_id, orden),
  KEY fk_secciones_encuesta (encuesta_id),
  CONSTRAINT fk_secciones_encuesta
    FOREIGN KEY (encuesta_id) REFERENCES encuestas(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE preguntas (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  encuesta_id INT UNSIGNED NOT NULL,
  seccion_id INT UNSIGNED NOT NULL,
  enunciado VARCHAR(255) NOT NULL,
  imagen MEDIUMTEXT NULL,
  tipo ENUM('texto', 'opcion_unica', 'opcion_multiple') NOT NULL DEFAULT 'texto',
  es_obligatoria TINYINT(1) NOT NULL DEFAULT 1,
  orden INT UNSIGNED NOT NULL DEFAULT 1,
  PRIMARY KEY (id),
  UNIQUE KEY uk_preguntas_seccion_orden (seccion_id, orden),
  KEY fk_preguntas_encuesta (encuesta_id),
  KEY fk_preguntas_seccion (seccion_id),
  CONSTRAINT fk_preguntas_encuesta
    FOREIGN KEY (encuesta_id) REFERENCES encuestas(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_preguntas_seccion
    FOREIGN KEY (seccion_id) REFERENCES secciones(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE opciones_pregunta (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  pregunta_id INT UNSIGNED NOT NULL,
  texto VARCHAR(180) NOT NULL,
  orden INT UNSIGNED NOT NULL DEFAULT 1,
  PRIMARY KEY (id),
  KEY fk_opciones_pregunta (pregunta_id),
  CONSTRAINT fk_opciones_pregunta
    FOREIGN KEY (pregunta_id) REFERENCES preguntas(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE respuestas (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  encuesta_id INT UNSIGNED NOT NULL,
  usuario_id INT UNSIGNED NOT NULL,
  fecha_respuesta TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY fk_respuestas_encuesta (encuesta_id),
  KEY fk_respuestas_usuario (usuario_id),
  CONSTRAINT fk_respuestas_encuesta
    FOREIGN KEY (encuesta_id) REFERENCES encuestas(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_respuestas_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE detalle_respuestas (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  respuesta_id INT UNSIGNED NOT NULL,
  pregunta_id INT UNSIGNED NOT NULL,
  opcion_id INT UNSIGNED NULL,
  texto_respuesta TEXT NULL,
  PRIMARY KEY (id),
  KEY fk_detalle_respuesta (respuesta_id),
  KEY fk_detalle_pregunta (pregunta_id),
  KEY fk_detalle_opcion (opcion_id),
  CONSTRAINT fk_detalle_respuesta
    FOREIGN KEY (respuesta_id) REFERENCES respuestas(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_detalle_pregunta
    FOREIGN KEY (pregunta_id) REFERENCES preguntas(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_detalle_opcion
    FOREIGN KEY (opcion_id) REFERENCES opciones_pregunta(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO usuarios (id, nombre, correo, password_hash, created_at) VALUES
  (1, 'martin', 'martin@gmail.com', '$2a$10$xDjV6uaqffgW4z8Nqeru.OQ9l3Omc86x9g0sVnQ0mJy6amlZKKu2O', '2026-04-11 10:21:46'),
  (2, 'Michael', 'michael@gmail.com', '$2a$10$HGlp.DGH/io0DfhWUoCXWuFvkjjGKFFbFGY83JwpFQTaLG0TpP6lq', '2026-04-11 10:48:05');

INSERT INTO encuestas (
  id,
  usuario_id,
  titulo,
  descripcion,
  imagen_portada,
  categoria,
  estado,
  mensaje_confirmacion,
  fecha_creacion
) VALUES
  (
    1,
    1,
    'Habitos de estudio',
    'Hablemos acerca de tus habitos estudiantiles',
    NULL,
    'Educacion',
    'publicada',
    'Gracias por completar esta encuesta. Tus respuestas fueron registradas correctamente.',
    '2026-04-11 10:46:09'
  ),
  (
    2,
    2,
    'Cosas favoritas',
    'Encuesta de seleccionar cosas que te gustan',
    NULL,
    'Prueba',
    'publicada',
    'Gracias por compartir tus gustos. Hemos guardado tu participacion.',
    '2026-04-11 12:26:10'
  );

INSERT INTO secciones (id, encuesta_id, titulo, descripcion, orden) VALUES
  (1, 1, 'Rutina de estudio', 'Preguntas iniciales sobre tu tiempo y organizacion.', 1),
  (2, 1, 'Habitos y percepcion', 'Completa esta seccion para finalizar la encuesta.', 2),
  (3, 2, 'Preferencias generales', 'Selecciona las opciones que mejor te representen.', 1);

INSERT INTO preguntas (
  id,
  encuesta_id,
  seccion_id,
  enunciado,
  imagen,
  tipo,
  es_obligatoria,
  orden
) VALUES
  (1, 1, 1, 'Cuantas horas al dia dedicas al estudio fuera de clases?', NULL, 'opcion_unica', 1, 1),
  (2, 1, 1, 'Con que frecuencia entregas tus tareas a tiempo?', NULL, 'opcion_unica', 1, 2),
  (3, 1, 2, 'Cual es tu principal metodo de estudio?', NULL, 'opcion_unica', 0, 1),
  (4, 1, 2, 'Que tan seguido te distraes mientras estudias?', NULL, 'opcion_unica', 1, 2),
  (5, 1, 2, 'Consideras que tienes buenos habitos de estudio?', NULL, 'texto', 1, 3),
  (6, 2, 3, 'Colores favoritos', NULL, 'opcion_multiple', 1, 1),
  (7, 2, 3, 'Deporte favorito', NULL, 'opcion_multiple', 0, 2),
  (8, 2, 3, 'Comida rapida favorita', NULL, 'opcion_multiple', 1, 3);

INSERT INTO opciones_pregunta (id, pregunta_id, texto, orden) VALUES
  (1, 1, 'Menos de 2 horas', 1),
  (2, 1, 'Entre 2 y 5 horas', 2),
  (3, 1, 'Mas de 5 horas', 3),
  (4, 2, 'Siempre', 1),
  (5, 2, 'Casi siempre', 2),
  (6, 2, 'A veces', 3),
  (7, 2, 'Nunca', 4),
  (8, 3, 'Videos', 1),
  (9, 3, 'Resumenes', 2),
  (10, 3, 'Resolver ejercicios', 3),
  (11, 3, 'Otro', 4),
  (12, 4, 'Nunca', 1),
  (13, 4, 'Poco', 2),
  (14, 4, 'A veces', 3),
  (15, 4, 'Mucho', 4),
  (16, 6, 'Rojo', 1),
  (17, 6, 'Azul', 2),
  (18, 6, 'Verde', 3),
  (19, 6, 'Negro', 4),
  (20, 7, 'Futbol', 1),
  (21, 7, 'Baloncesto', 2),
  (22, 7, 'Tenis', 3),
  (23, 7, 'Natacion', 4),
  (24, 8, 'Pizza', 1),
  (25, 8, 'Hamburguesa', 2),
  (26, 8, 'Perro caliente', 3),
  (27, 8, 'Sandwich', 4);

INSERT INTO respuestas (id, encuesta_id, usuario_id, fecha_respuesta) VALUES
  (1, 1, 1, '2026-04-11 10:46:30'),
  (2, 1, 2, '2026-04-11 10:48:32'),
  (3, 2, 1, '2026-04-11 12:27:27');

INSERT INTO detalle_respuestas (id, respuesta_id, pregunta_id, opcion_id, texto_respuesta) VALUES
  (1, 1, 1, 1, NULL),
  (2, 1, 2, 4, NULL),
  (3, 1, 4, 13, NULL),
  (4, 1, 5, NULL, 'Si, aunque a veces me cuesta mantener la disciplina.'),
  (5, 2, 1, 2, NULL),
  (6, 2, 2, 6, NULL),
  (7, 2, 3, 10, NULL),
  (8, 2, 4, 14, NULL),
  (9, 2, 5, NULL, 'Intento mejorar cada semestre.'),
  (10, 3, 6, 16, NULL),
  (11, 3, 6, 18, NULL),
  (12, 3, 8, 24, NULL),
  (13, 3, 8, 25, NULL);
