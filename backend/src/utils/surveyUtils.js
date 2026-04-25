export function normalizarTexto(valor) {
  return typeof valor === 'string' ? valor.trim() : '';
}

export function esImagenValida(valor) {
  if (valor == null || valor === '') {
    return true;
  }

  return typeof valor === 'string' && valor.startsWith('data:image/');
}

export function mapearEncuestaDetallada(filas) {
  if (filas.length === 0) {
    return null;
  }

  const encuestaBase = filas[0];
  const encuesta = {
    id: encuestaBase.encuesta_id,
    usuario_id: encuestaBase.usuario_id,
    titulo: encuestaBase.titulo,
    descripcion: encuestaBase.descripcion,
    imagen_portada: encuestaBase.imagen_portada,
    categoria: encuestaBase.categoria,
    estado: encuestaBase.estado,
    mensaje_confirmacion: encuestaBase.mensaje_confirmacion,
    fecha_creacion: encuestaBase.fecha_creacion,
    nombre_creador: encuestaBase.nombre_creador,
    secciones: []
  };

  const secciones = new Map();

  for (const fila of filas) {
    if (!fila.seccion_id) {
      continue;
    }

    if (!secciones.has(fila.seccion_id)) {
      const seccion = {
        id: fila.seccion_id,
        titulo: fila.seccion_titulo,
        descripcion: fila.seccion_descripcion,
        orden: fila.seccion_orden,
        preguntas: []
      };

      secciones.set(fila.seccion_id, seccion);
      encuesta.secciones.push(seccion);
    }

    if (!fila.pregunta_id) {
      continue;
    }

    const seccion = secciones.get(fila.seccion_id);
    let pregunta = seccion.preguntas.find((item) => item.id === fila.pregunta_id);

    if (!pregunta) {
      pregunta = {
        id: fila.pregunta_id,
        enunciado: fila.enunciado,
        imagen: fila.pregunta_imagen,
        tipo: fila.tipo,
        es_obligatoria: Boolean(fila.es_obligatoria),
        orden: fila.pregunta_orden,
        opciones: []
      };

      seccion.preguntas.push(pregunta);
    }

    if (fila.opcion_id) {
      pregunta.opciones.push({
        id: fila.opcion_id,
        texto: fila.opcion_texto,
        orden: fila.opcion_orden
      });
    }
  }

  encuesta.secciones = encuesta.secciones
    .sort((a, b) => a.orden - b.orden)
    .map((seccion) => ({
      ...seccion,
      preguntas: seccion.preguntas
        .sort((a, b) => a.orden - b.orden)
        .map((pregunta) => ({
          ...pregunta,
          opciones: pregunta.opciones.sort((a, b) => a.orden - b.orden)
        }))
    }));

  return encuesta;
}

export function validarSecciones(secciones) {
  if (!Array.isArray(secciones) || secciones.length === 0) {
    return 'Debes agregar al menos una seccion.';
  }

  for (const seccion of secciones) {
    if (!normalizarTexto(seccion.titulo)) {
      return 'Cada seccion debe tener un titulo.';
    }

    if (!Array.isArray(seccion.preguntas) || seccion.preguntas.length === 0) {
      return 'Cada seccion debe incluir al menos una pregunta.';
    }

    for (const pregunta of seccion.preguntas) {
      if (!normalizarTexto(pregunta.enunciado) || !pregunta.tipo) {
        return 'Todas las preguntas deben tener enunciado y tipo.';
      }

      if (!esImagenValida(pregunta.imagen)) {
        return 'La imagen de una pregunta no tiene un formato valido.';
      }

      if (
        ['opcion_unica', 'opcion_multiple'].includes(pregunta.tipo) &&
        (!Array.isArray(pregunta.opciones) || pregunta.opciones.length < 2)
      ) {
        return 'Las preguntas de opcion requieren al menos dos opciones.';
      }

      if (
        ['opcion_unica', 'opcion_multiple'].includes(pregunta.tipo) &&
        pregunta.opciones.some((opcion) => !normalizarTexto(opcion.texto))
      ) {
        return 'Todas las opciones deben tener texto.';
      }
    }
  }

  return '';
}
