import { ApolloServer } from '@apollo/server';
import { startServerAndCreateNextHandler } from '@as-integrations/next';

import typeDefs from './_schema.js';
import resolvers from './_resolvers.js';

// import { rateLimiter } from './_rateLimiter.js';

// The ApolloServer constructor requires two parameters: your schema
// definition and your set of resolvers.
const server = new ApolloServer({
  typeDefs,
  resolvers,
  plugins: [
    // rateLimiter.createPlugin()
  ]
});

export default startServerAndCreateNextHandler(server, {
  context: async (req, res) => {
    return { req, res };
  },
});