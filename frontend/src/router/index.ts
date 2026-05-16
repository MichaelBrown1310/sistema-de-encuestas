import { createRouter, createWebHistory } from '@ionic/vue-router';
import LoginPage from '../views/LoginPage.vue';
import RegisterPage from '../views/RegisterPage.vue';
import Layout from './Layout.vue';
import HomePage from '../views/HomePage.vue';
import EncuestasPage from '../views/EncuestasPage.vue';
import ExplorarEncuestasPage from '../views/ExplorarEncuestasPage.vue';
import CrearEncuestaPage from '../views/CrearEncuestaPage.vue';
import ResponderEncuestaPage from '../views/ResponderEncuestaPage.vue';
import RespuestasPage from '../views/RespuestasPage.vue';
import SurveyResponsesPage from '../views/SurveyResponsesPage.vue';
import MyResponseDetailPage from '../views/MyResponseDetailPage.vue';
import { useAuthStore } from '../stores/auth';
import { pinia } from '../stores/pinia';

const routes = [
  {
    path: '/login',
    component: LoginPage
  },
  {
    path: '/register',
    component: RegisterPage
  },
  {
    path: '/',
    component: Layout,
    children: [
      {
        path: '',
        redirect: '/home'
      },
      {
        path: 'home',
        component: HomePage
      },
      {
        path: 'encuestas',
        component: EncuestasPage
      },
      {
        path: 'encuestas/explorar',
        component: ExplorarEncuestasPage
      },
      {
        path: 'encuestas/crear',
        component: CrearEncuestaPage
      },
      {
        path: 'encuestas/:id/editar',
        component: CrearEncuestaPage
      },
      {
        path: 'encuestas/:id/responder',
        component: ResponderEncuestaPage
      },
      {
        path: 'encuestas/:id/respuestas',
        component: SurveyResponsesPage
      },
      {
        path: 'respuestas',
        component: RespuestasPage
      },
      {
        path: 'respuestas/:respuestaId',
        component: MyResponseDetailPage
      }
    ]
  }
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
});

router.beforeEach((to) => {
  const authStore = useAuthStore(pinia);
  authStore.inicializarDesdePersistencia();
  const esRutaAutenticacion = to.path === '/login' || to.path === '/register';
  const esRutaProtegida = !esRutaAutenticacion;

  if (!authStore.isAuthenticated && esRutaProtegida) {
    return '/login';
  }

  if (authStore.isAuthenticated && esRutaAutenticacion) {
    return '/home';
  }
});

export default router;
