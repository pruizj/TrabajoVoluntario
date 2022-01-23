import { ApolloError } from "apollo-server";
import { ApolloServer, gql } from "apollo-server-express";
import { typeDefs } from "./schema";
import { Query } from "./resolvers/query";
import { Mutation } from "./resolvers/mutation";
import { connectDB } from "./mongo";
import { createServer } from 'http';
import { execute, subscribe } from 'graphql';
import { SubscriptionServer } from 'subscriptions-transport-ws';
import { makeExecutableSchema } from '@graphql-tools/schema';
const { PubSub } = require("graphql-subscriptions");
import express from "express";
import { Subscription } from "./resolvers/subscriptions";
import { Message, Channel, User } from "./types"
const config = require('./config.js');

export const pubsub = new PubSub();

let channels: Channel[] = [];

const resolvers = {
  Query,
  Mutation,
  Subscription
}

const run = async () => {
  const db = await connectDB();
  const app = express();
  const httpServer = createServer(app);
  const schema = makeExecutableSchema({ typeDefs, resolvers });
  const server = new ApolloServer({
    schema,
    plugins: [{
      async serverWillStart() {
        return {
          async drainServer() {
            subscriptionServer.close();
          }
        };
      }
    }],
    context: async ({ req, res }) => {
      const reqAuth = ["signout", "logout", "getChats", "join", "quit", "sendMessage"]
      if (reqAuth.some(auth => req.body.query.includes(auth))) {
        if (req.headers.token == null) throw new ApolloError("Not athorized", "403");
        const token = req.headers.token;
        const user = await db.collection("usuarios").findOne({ token: token });
        if (!user) throw new ApolloError("Not athorized", "403");
        return {
          db,
          user,
          channels
        }
      }

      return {
        db,
        channels
      }
    },
  });
  (async function () {
    await server.start();
    server.applyMiddleware({ app, cors: true });
  })();

  const subscriptionServer = SubscriptionServer.create({
    schema,
    execute,
    subscribe,
    onConnect() {
      console.log("SubscriptionServer ready!");
    },
  }, {
    server: httpServer,
    path: server.graphqlPath,
  });

  httpServer.listen(config.PORT, () => {
    console.log(
      `Query endpoint ready at http://localhost:${config.PORT}${server.graphqlPath}`
    );
    console.log(
      `Subscription endpoint ready at ws://localhost:${config.PORT}${server.graphqlPath}`
    );
  });

}

try {
  run();
} catch (e) {
  console.error(e);
}