export function normalizarTexto(valor) {
  return typeof valor === 'string' ? valor.trim() : '';
}

export function esImagenValida(valor) {
  if (valor == null || valor === '') {
    return true;
  }

  return typeof valor === 'string' && valor.startsWith('data:image/');
}

function calcularBytesBase64(dataUrl) {
  if (typeof dataUrl !== 'string') {
    return 0;
  }

  const partes = dataUrl.split(',');

  if (partes.length < 2) {
    return 0;
  }

  const base64 = partes[1];
  const padding = (base64.match(/=*$/)?.[0].length || 0);
  return Math.floor((base64.length * 3) / 4) - padding;
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
    esta_oculta: Boolean(encuestaBase.esta_oculta),
    respuesta_unica_usuario: Boolean(encuestaBase.respuesta_unica_usuario),
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

export function mapearEncuestasRespondidas(filas) {
  return filas.map((fila) => ({
    respuesta_id: fila.respuesta_id,
    fecha_respuesta: fila.fecha_respuesta,
    encuesta: {
      id: fila.encuesta_id,
      titulo: fila.titulo,
      descripcion: fila.descripcion,
      categoria: fila.categoria,
      estado: fila.estado,
      nombre_creador: fila.nombre_creador
    }
  }));
}

export function mapearDetalleRespuestaUsuario(filas) {
  if (filas.length === 0) {
    return null;
  }

  const base = filas[0];
  const respuesta = {
    respuesta_id: base.respuesta_id,
    fecha_respuesta: base.fecha_respuesta,
    encuesta: {
      id: base.encuesta_id,
      titulo: base.encuesta_titulo,
      descripcion: base.encuesta_descripcion,
      categoria: base.encuesta_categoria,
      estado: base.encuesta_estado,
      nombre_creador: base.nombre_creador
    },
    detalles: []
  };

  const detalles = new Map();

  for (const fila of filas) {
    if (!detalles.has(fila.pregunta_id)) {
      detalles.set(fila.pregunta_id, {
        seccion_id: fila.seccion_id,
        seccion_titulo: fila.seccion_titulo,
        seccion_orden: fila.seccion_orden,
        pregunta_id: fila.pregunta_id,
        enunciado: fila.enunciado,
        tipo: fila.tipo,
        pregunta_orden: fila.pregunta_orden,
        texto_respuesta: fila.texto_respuesta,
        opciones: []
      });

      respuesta.detalles.push(detalles.get(fila.pregunta_id));
    }

    if (fila.opcion_id) {
      detalles.get(fila.pregunta_id).opciones.push({
        id: fila.opcion_id,
        texto: fila.opcion_texto
      });
    }
  }

  respuesta.detalles.sort((a, b) => {
    if (a.seccion_orden !== b.seccion_orden) {
      return a.seccion_orden - b.seccion_orden;
    }

    return a.pregunta_orden - b.pregunta_orden;
  });

  return respuesta;
}

export function mapearRespuestasRecibidas(filas) {
  if (filas.length === 0) {
    return null;
  }

  const base = filas[0];
  const encuesta = {
    id: base.encuesta_id,
    titulo: base.encuesta_titulo,
    estado: base.encuesta_estado,
    respuestas: []
  };

  const respuestas = new Map();

  for (const fila of filas) {
    if (!respuestas.has(fila.respuesta_id)) {
      respuestas.set(fila.respuesta_id, {
        id: fila.respuesta_id,
        fecha_respuesta: fila.fecha_respuesta,
        respondedor: {
          id: fila.respondedor_id,
          nombre: fila.respondedor_nombre,
          correo: fila.respondedor_correo
        },
        detalles: []
      });

      encuesta.respuestas.push(respuestas.get(fila.respuesta_id));
    }

    const respuesta = respuestas.get(fila.respuesta_id);
    let detalle = respuesta.detalles.find((item) => item.pregunta_id === fila.pregunta_id);

    if (!detalle) {
      detalle = {
        seccion_id: fila.seccion_id,
        seccion_titulo: fila.seccion_titulo,
        seccion_orden: fila.seccion_orden,
        pregunta_id: fila.pregunta_id,
        enunciado: fila.enunciado,
        tipo: fila.tipo,
        pregunta_orden: fila.pregunta_orden,
        texto_respuesta: fila.texto_respuesta,
        opciones: []
      };

      respuesta.detalles.push(detalle);
    }

    if (fila.opcion_id) {
      detalle.opciones.push({
        id: fila.opcion_id,
        texto: fila.opcion_texto
      });
    }
  }

  for (const respuesta of encuesta.respuestas) {
    respuesta.detalles.sort((a, b) => {
      if (a.seccion_orden !== b.seccion_orden) {
        return a.seccion_orden - b.seccion_orden;
      }

      return a.pregunta_orden - b.pregunta_orden;
    });
  }

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

export function validarPesoImagenes(imagenPortada, secciones) {
  const LIMITE_IMAGEN = 1.5 * 1024 * 1024;
  const LIMITE_TOTAL = 3 * 1024 * 1024;

  let total = 0;

  const pesoPortada = calcularBytesBase64(imagenPortada);

  if (pesoPortada > LIMITE_IMAGEN) {
    return 'La imagen de portada supera el limite de 1.5 MB.';
  }

  total += pesoPortada;

  for (const seccion of secciones || []) {
    for (const pregunta of seccion.preguntas || []) {
      const pesoPregunta = calcularBytesBase64(pregunta.imagen);

      if (pesoPregunta > LIMITE_IMAGEN) {
        return 'Una de las imagenes de pregunta supera el limite de 1.5 MB.';
      }

      total += pesoPregunta;
    }
  }

  if (total > LIMITE_TOTAL) {
    return 'El total de imagenes de la encuesta supera el limite permitido de 3 MB.';
  }

  return '';
}
