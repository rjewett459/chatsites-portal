import routes from './routes.js'; // Use relative path

import create from "/:create.jsx";

export default {
  context: import("/:context.js"),
  routes,
  create,
};
