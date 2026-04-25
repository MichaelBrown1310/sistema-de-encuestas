USE encuestas;

ALTER TABLE encuestas
  ADD COLUMN imagen_portada LONGTEXT NULL AFTER descripcion,
  ADD COLUMN mensaje_confirmacion TEXT NOT NULL DEFAULT 'Tu respuesta ha sido enviada correctamente.' AFTER estado,
  ADD COLUMN esta_oculta TINYINT(1) NOT NULL DEFAULT 0 AFTER mensaje_confirmacion;

CREATE TABLE IF NOT EXISTS secciones (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  encuesta_id INT UNSIGNED NOT NULL,
  titulo VARCHAR(180) NOT NULL,
  descripcion TEXT NULL,
  orden INT UNSIGNED NOT NULL DEFAULT 1,
  CONSTRAINT fk_secciones_encuesta
    FOREIGN KEY (encuesta_id) REFERENCES encuestas(id)
    ON DELETE CASCADE
);

ALTER TABLE preguntas
  ADD COLUMN seccion_id INT UNSIGNED NULL AFTER encuesta_id,
  ADD COLUMN imagen LONGTEXT NULL AFTER enunciado,
  ADD COLUMN es_obligatoria TINYINT(1) NOT NULL DEFAULT 1 AFTER tipo;

INSERT INTO secciones (encuesta_id, titulo, descripcion, orden)
SELECT e.id, 'Seccion principal', NULL, 1
FROM encuestas e
WHERE NOT EXISTS (
  SELECT 1 FROM secciones s WHERE s.encuesta_id = e.id
);

UPDATE preguntas p
INNER JOIN secciones s ON s.encuesta_id = p.encuesta_id AND s.orden = 1
SET p.seccion_id = s.id
WHERE p.seccion_id IS NULL;

ALTER TABLE preguntas
  MODIFY COLUMN seccion_id INT UNSIGNED NOT NULL,
  ADD CONSTRAINT fk_preguntas_seccion
    FOREIGN KEY (seccion_id) REFERENCES secciones(id)
    ON DELETE CASCADE;
