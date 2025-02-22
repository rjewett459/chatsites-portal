export default [
  { path: '/', component: () => import('./Home.jsx') },
  { path: '/about', component: () => import('./About.jsx') }
];
