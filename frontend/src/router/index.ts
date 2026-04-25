import { createRouter, createWebHistory } from '@ionic/vue-router';
import LoginPage from '../views/LoginPage.vue';
import RegisterPage from '../views/RegisterPage.vue';
import HomePage from '../views/HomePage.vue';
import EncuestasPage from '../views/EncuestasPage.vue';
import ExplorarEncuestasPage from '../views/ExplorarEncuestasPage.vue';
import CrearEncuestaPage from '../views/CrearEncuestaPage.vue';
import ResponderEncuestaPage from '../views/ResponderEncuestaPage.vue';
import RespuestasPage from '../views/RespuestasPage.vue';
import SurveyResponsesPage from '../views/SurveyResponsesPage.vue';
import { obtenerUsuarioAutenticado } from '../services/auth';

const routes = [
  {
    path: '/',
    redirect: '/home'
  },
  {
    path: '/login',
    component: LoginPage
  },
  {
    path: '/register',
    component: RegisterPage
  },
  {
    path: '/home',
    component: HomePage
  },
  {
    path: '/encuestas',
    component: EncuestasPage
  },
  {
    path: '/encuestas/explorar',
    component: ExplorarEncuestasPage
  },
  {
    path: '/encuestas/crear',
    component: CrearEncuestaPage
  },
  {
    path: '/encuestas/:id/editar',
    component: CrearEncuestaPage
  },
  {
    path: '/encuestas/:id/responder',
    component: ResponderEncuestaPage
  },
  {
    path: '/encuestas/:id/respuestas',
    component: SurveyResponsesPage
  },
  {
    path: '/respuestas',
    component: RespuestasPage
  }
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
});

router.beforeEach((to) => {
  const usuario = obtenerUsuarioAutenticado();
  const esRutaAutenticacion = to.path === '/login' || to.path === '/register';
  const esRutaProtegida = !esRutaAutenticacion;

  if (!usuario && esRutaProtegida) {
    return '/login';
  }

  if (usuario && esRutaAutenticacion) {
    return '/home';
  }
});

export default router;
