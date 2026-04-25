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

export async function crearEncuesta(datos: DatosNuevaEncuesta) {
  const { data } = await api.post('/encuestas', datos);
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
