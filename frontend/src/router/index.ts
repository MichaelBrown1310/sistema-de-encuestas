import { createRouter, createWebHistory } from '@ionic/vue-router';
import LoginPage from '../views/LoginPage.vue';
import RegisterPage from '../views/RegisterPage.vue';
import HomePage from '../views/HomePage.vue';
import { getAuthUser } from '../services/auth';

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
  }
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
});

router.beforeEach((to) => {
  const user = getAuthUser();
  const isAuthRoute = to.path === '/login' || to.path === '/register';

  if (!user && to.path === '/home') {
    return '/login';
  }

  if (user && isAuthRoute) {
    return '/home';
  }
});

export default router;
