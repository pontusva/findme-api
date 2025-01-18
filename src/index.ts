import Fastify, {
  FastifyInstance,
  FastifyReply,
  FastifyRequest,
} from "fastify";
import pushNotificationRoutes from "./routes/pushNotification";
import { createServer } from "http";
import { schema } from "./schema";
import fastifyWebsocket from "@fastify/websocket";
import { createYoga, YogaInitialContext } from "graphql-yoga";
import clerkWebhookRoutes from "./webhooks/clerk";
import { useServer } from "graphql-ws/lib/use/ws";
import { WebSocketServer } from "ws";
import cors from "@fastify/cors";
import "dotenv/config";
import prisma from "./lib/prisma";
import multipart from "@fastify/multipart";
import { uploadRoutes } from "./routes/upload";
import { PrismaClient } from "@prisma/client";
import { clerkClient, clerkPlugin, getAuth } from "@clerk/fastify";

declare module "fastify" {
  interface FastifyRequest {
    userId?: string;
  }
}

export interface Context {
  prisma: PrismaClient;
  request: FastifyRequest;
  userId?: string;
}

interface ConnectionParams {
  Authorization?: string;
}

// Add this interface for the GraphQL request body
interface GraphQLRequestBody {
  query?: string;
  operationName?: string;
  variables?: Record<string, any>;
}
const fastify: FastifyInstance = Fastify();
fastify.register(fastifyWebsocket);
fastify.register(clerkPlugin);

const yoga = createYoga<{
  req: FastifyRequest;
  reply: FastifyReply;
}>({
  graphiql: {
    subscriptionsProtocol: "WS",
    defaultQuery: "# Welcome to GraphQL\n",
  },
  renderGraphiQL: () => {
    return `
      <!DOCTYPE html>
      <html lang="en">
        <body style="margin: 0; overflow-x: hidden; overflow-y: hidden">
        <div id="sandbox" style="height:100vh; width:100vw;"></div>
        <script src="https://embeddable-sandbox.cdn.apollographql.com/_latest/embeddable-sandbox.umd.production.min.js"></script>
        <script>
        new window.EmbeddedSandbox({
          target: "#sandbox",
          // Pass through your server href if you are embedding on an endpoint.
          // Otherwise, you can pass whatever endpoint you want Sandbox to start up with here.
          initialEndpoint: "http://localhost:3000/graphql",
        });
        // advanced options: https://www.apollographql.com/docs/studio/explorer/sandbox#embedding-sandbox
        </script>
        </body>
      </html>`;
  },
  graphqlEndpoint: "/graphql",
  landingPage: false,
  schema,
  context: async ({ request }: YogaInitialContext) => {
    // List of mutations/queries that don't require authentication
    const publicOperations = ["login", "createUser"];

    // Get the operation name from the request
    const body = request.body as GraphQLRequestBody;
    const operationName = body?.operationName;

    // Only allow initial page  load and introspection without auth
    if (!body?.query || operationName === "IntrospectionQuery") {
      console.log("IntrospectionQuery");
      return {
        prisma,
        userId: null,
      };
    }

    // Check if this is a public operation
    if (operationName && publicOperations.includes(operationName)) {
      return {
        prisma,
        userId: null,
      };
    }

    // For all other operations, require authentication
    const token = request.headers.get("authorization");

    if (!token) {
      throw new Error("Authentication required");
    }

    try {
      const session = await clerkClient.sessions.getSession(token);

      return {
        prisma,
        userId: session.userId,
      };
    } catch (error) {
      console.error("Authentication error:", error);
      throw new Error("Invalid token");
    }
  },
});

const httpServer = createServer(yoga);

const wsServer = new WebSocketServer({
  server: httpServer,
  path: yoga.graphqlEndpoint,
});

useServer(
  {
    schema,
    context: async (ctx) => {
      const token = "";
      const sessionId = ctx.connectionParams?.sessionId;
      let userId: string | null = null;

      return {
        prisma,
        userId,
      };
    },
    onConnect: (ctx) => {
      console.log("Client connected for subscriptions");
    },
    onDisconnect: (ctx) => {
      console.log("Client disconnected from subscriptions");
    },
  },
  wsServer
);

fastify.route({
  // Bind to the Yoga's endpoint to avoid rendering on any path
  url: yoga.graphqlEndpoint,
  method: ["GET", "POST", "OPTIONS"],
  handler: async (req, reply) => {
    // Second parameter adds Fastify's `req` and `reply` to the GraphQL Context
    const response = await yoga.handleNodeRequestAndResponse(req, reply, {
      req,
      reply,
    });
    response.headers.forEach((value, key) => {
      reply.header(key, value);
    });

    reply.status(response.status);

    reply.send(response.body);

    return reply;
  },
});

// Create a Fastify middleware for auth
const requireAuth = () => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const authHeader = request.headers.authorization;
      if (!authHeader?.startsWith("Bearer ")) {
        return reply.status(401).send({ error: "Authentication required" });
      }

      const token = authHeader.split(" ")[1];
      const { userId } = await clerkClient.sessions.verifySession(
        authHeader,
        token
      );

      if (!userId) {
        return reply.status(401).send({ error: "Invalid token" });
      }

      // Attach the userId to the request for use in route handlers
      request.userId = userId;
    } catch (error) {
      return reply.status(401).send({ error: "Invalid authentication token" });
    }
  };
};

// Use it in your routes
fastify.get(
  "/protected",
  {
    preHandler: requireAuth(),
  },
  async (request, reply) => {
    reply.send("This is a protected route");
  }
);

const start = async () => {
  try {
    await fastify.register(cors, {
      origin: true, // Or specify your frontend URL
      methods: ["GET", "POST", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
      credentials: true,
    });
    await fastify.register(pushNotificationRoutes);
    await fastify.register(uploadRoutes);
    await fastify.register(clerkWebhookRoutes);
    await fastify.register(multipart, {
      limits: {
        fileSize: 5_000_000, // 5MB limit
        files: 1, // Maximum number of files
      },
    });
    fastify.addHook("onRequest", async (request, reply) => {
      reply.header(
        "Content-Security-Policy",
        "default-src 'self'; " +
          "script-src 'self' 'unsafe-inline' 'unsafe-eval' unpkg.com embeddable-sandbox.cdn.apollographql.com sandbox.embed.apollographql.com; " +
          "style-src 'self' 'unsafe-inline'; " +
          "connect-src 'self' ws://localhost:3000 wss://localhost:3000; " + // Allow both ws and wss
          "img-src 'self' data: embeddable-sandbox.cdn.apollographql.com sandbox.embed.apollographql.com; " +
          "font-src 'self' data:; " +
          "frame-src sandbox.embed.apollographql.com; " +
          "frame-ancestors 'self' sandbox.embed.apollographql.com;"
      );
    });
    await fastify.listen({ port: 3000 });

    const address = fastify.server.address();
    const port = typeof address === "string" ? address : address?.port;
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};
httpServer.listen(4000, () => {
  console.log("Server is running on port 4000");
});
start();
