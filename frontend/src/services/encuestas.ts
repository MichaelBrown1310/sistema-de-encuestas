import api from './api';

export interface OpcionPregunta {
  id?: number;
  texto: string;
  orden?: number;
}

export interface PreguntaEncuesta {
  id?: number;
  enunciado: string;
  imagen?: string | null;
  tipo: 'texto' | 'opcion_unica' | 'opcion_multiple';
  es_obligatoria: boolean;
  orden?: number;
  opciones: OpcionPregunta[];
}

export interface SeccionEncuesta {
  id?: number;
  titulo: string;
  descripcion?: string | null;
  orden?: number;
  preguntas: PreguntaEncuesta[];
}

export interface Encuesta {
  id: number;
  usuario_id: number;
  titulo: string;
  descripcion: string;
  imagen_portada?: string | null;
  categoria: string;
  estado: string;
  mensaje_confirmacion: string;
  esta_oculta?: boolean;
  respuesta_unica_usuario?: boolean;
  fecha_creacion: string;
}

export interface EncuestaPublica extends Encuesta {
  nombre_creador: string;
}

export interface EncuestaDetallada extends EncuestaPublica {
  secciones: SeccionEncuesta[];
}

export interface ResumenEncuestas {
  totalEncuestas: number;
  totalPublicadas: number;
  totalBorradores: number;
}

export interface DatosNuevaEncuesta {
  usuario_id: number;
  titulo: string;
  descripcion: string;
  imagen_portada?: string | null;
  categoria: string;
  estado: string;
  mensaje_confirmacion: string;
  respuesta_unica_usuario: boolean;
  secciones: SeccionEncuesta[];
}

export interface RespuestaFormulario {
  pregunta_id: number;
  opcion_id?: number | null;
  texto_respuesta?: string | null;
}

export interface RespuestaEnvioEncuesta {
  message: string;
  mensaje_confirmacion: string;
}

export interface RespuestaRecibidaDetalle {
  seccion_id: number;
  seccion_titulo: string;
  pregunta_id: number;
  enunciado: string;
  tipo: string;
  texto_respuesta?: string | null;
  opciones: OpcionPregunta[];
}

export interface RespuestaRecibida {
  id: number;
  fecha_respuesta: string;
  respondedor: {
    id: number;
    nombre: string;
    correo: string;
  };
  detalles: RespuestaRecibidaDetalle[];
}

export interface RespuestasRecibidasEncuesta {
  id: number;
  titulo: string;
  estado: string;
  respuestas: RespuestaRecibida[];
}

export interface MiRespuestaResumen {
  respuesta_id: number;
  fecha_respuesta: string;
  encuesta: {
    id: number;
    titulo: string;
    descripcion: string;
    categoria: string;
    estado: string;
    nombre_creador: string;
  };
}

export interface MiRespuestaDetalle {
  respuesta_id: number;
  fecha_respuesta: string;
  encuesta: {
    id: number;
    titulo: string;
    descripcion: string;
    categoria: string;
    estado: string;
    nombre_creador: string;
  };
  detalles: RespuestaRecibidaDetalle[];
}

export async function obtenerResumenUsuario(usuarioId: number) {
  const { data } = await api.get<ResumenEncuestas>(`/encuestas/resumen/${usuarioId}`);
  return data;
}

export async function obtenerEncuestasUsuario(usuarioId: number) {
  const { data } = await api.get<Encuesta[]>(`/encuestas?usuarioId=${usuarioId}`);
  return data;
}

export async function obtenerEncuestasPublicadas() {
  const { data } = await api.get<EncuestaPublica[]>('/encuestas/publicadas');
  return data;
}

export async function obtenerEncuestaPublicada(encuestaId: number) {
  const { data } = await api.get<EncuestaDetallada>(`/encuestas/publicadas/${encuestaId}`);
  return data;
}

export async function obtenerEncuestaPropia(encuestaId: number, usuarioId: number) {
  const { data } = await api.get<EncuestaDetallada>(`/encuestas/${encuestaId}?usuarioId=${usuarioId}`);
  return data;
}

export async function crearEncuesta(datos: DatosNuevaEncuesta) {
  const { data } = await api.post('/encuestas', datos);
  return data;
}

export async function actualizarEncuesta(encuestaId: number, datos: DatosNuevaEncuesta) {
  const { data } = await api.put(`/encuestas/${encuestaId}`, datos);
  return data;
}

export async function publicarEncuesta(encuestaId: number, usuarioId: number) {
  const { data } = await api.post(`/encuestas/${encuestaId}/publicar`, {
    usuario_id: usuarioId
  });
  return data;
}

export async function cambiarOcultamientoEncuesta(
  encuestaId: number,
  usuarioId: number,
  estaOculta: boolean
) {
  const { data } = await api.post(`/encuestas/${encuestaId}/ocultar`, {
    usuario_id: usuarioId,
    esta_oculta: estaOculta
  });
  return data;
}

export async function eliminarEncuesta(encuestaId: number, usuarioId: number) {
  const { data } = await api.delete(`/encuestas/${encuestaId}?usuarioId=${usuarioId}`);
  return data;
}

export async function duplicarEncuesta(encuestaId: number, usuarioId: number) {
  const { data } = await api.post(`/encuestas/${encuestaId}/duplicar`, {
    usuario_id: usuarioId
  });
  return data;
}

export async function obtenerRespuestasRecibidas(encuestaId: number, usuarioId: number) {
  const { data } = await api.get<RespuestasRecibidasEncuesta>(
    `/encuestas/${encuestaId}/respuestas?usuarioId=${usuarioId}`
  );
  return data;
}

export async function exportarRespuestasEncuesta(
  encuestaId: number,
  usuarioId: number,
  formato: 'csv' | 'excel'
) {
  const extension = formato === 'excel' ? 'xls' : 'csv';
  const respuesta = await api.get(`/encuestas/${encuestaId}/exportar`, {
    params: {
      usuarioId,
      formato
    },
    responseType: 'blob'
  });

  return {
    blob: respuesta.data as Blob,
    nombreArchivo: `respuestas-encuesta-${encuestaId}.${extension}`
  };
}

export async function obtenerMisRespuestas(usuarioId: number) {
  const { data } = await api.get<MiRespuestaResumen[]>(`/encuestas/mis-respuestas?usuarioId=${usuarioId}`);
  return data;
}

export async function obtenerMiRespuesta(respuestaId: number, usuarioId: number) {
  const { data } = await api.get<MiRespuestaDetalle>(
    `/encuestas/mis-respuestas/${respuestaId}?usuarioId=${usuarioId}`
  );
  return data;
}

export async function enviarRespuestasEncuesta(
  encuestaId: number,
  usuarioId: number,
  respuestas: RespuestaFormulario[]
) {
  const { data } = await api.post<RespuestaEnvioEncuesta>(`/encuestas/${encuestaId}/respuestas`, {
    usuario_id: usuarioId,
    respuestas
  });
  return data;
}
