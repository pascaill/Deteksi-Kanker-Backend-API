require("dotenv").config();

const Hapi = require("@hapi/hapi");
const routes = require("../server/routes");
const loadModel = require("../services/loadModel");
const InputError = require("../exceptions/inputError");

(async () => {
  const server = Hapi.server({
    port: process.env.APP_PORT || 8080,
		  host: process.env.APP_HOST || "localhost",
    routes: {
      cors: {
        origin: ["*"],
      },
    },
  });

  const model = await loadModel();
  server.app.model = model;

  server.route(routes);

  server.ext("onPreResponse", function (request, h) {
    const response = request.response;

    if (response.isBoom) {
      const statusCode =
        response instanceof InputError
          ? response.statusCode
          : response.output.statusCode;
      const newMessage =
        statusCode === 413
          ? "Payload content length greater than maximum allowed: 1000000"
          : "Terjadi kesalahan dalam melakukan prediksi";

      const newResponse = h.response({
        status: "fail",
        message: newMessage,
      });

      newResponse.code(statusCode);
      return newResponse;
    }

    return h.continue;
  });

  await server.start();
  console.log(`Server start at: ${server.info.uri}`);
})();
