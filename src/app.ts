import process from "node:process";
import Fastify from "fastify";

const app = Fastify();

app.get("/", async () => {
  return "Hello World";
});

const start = async () => {
  try {
    await app.listen({ port: 3000 });
  }
  catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
