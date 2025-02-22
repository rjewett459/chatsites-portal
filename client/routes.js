<<<<<<< HEAD
export default [
  { path: '/', component: () => import('./Home.jsx') },
  { path: '/about', component: () => import('./About.jsx') }
];
=======
const routes = [
  {
    path: "/",
    component: () => import("./components/App.jsx"),  // ✅ Corrected path
  },
  {
    path: "/about",
    component: () => import("./components/About.jsx"),  // ✅ Corrected path
  },
];

export default routes;

>>>>>>> 13e6147 (Updated API key usage, added missing components, and fixed imports)
