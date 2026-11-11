import { createRouter, createWebHistory } from 'vue-router';
import UserBooking from './components/UserBooking.vue';
import AdminSlots from './components/AdminSlots.vue';

const routes = [
  {
    path: '/',
    name: 'UserBooking',
    component: UserBooking
  },
  {
    path: '/admin',
    name: 'AdminSlots',
    component: AdminSlots
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;