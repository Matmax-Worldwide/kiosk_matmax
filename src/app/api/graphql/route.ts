import { ApolloServer } from '@apollo/server';
import { startServerAndCreateNextHandler } from '@as-integrations/next';

import type { NextRequest } from 'next/server';

import typeDefs from '../_schema.js';
import resolvers from '../_resolvers.js';

const server = new ApolloServer({
  typeDefs,
  resolvers,
  plugins: [
    // Add any necessary Apollo Server plugins here
  ]
});

const handler = startServerAndCreateNextHandler(server, {
  context: async (req: NextRequest) => ({ req })
});

export const GET = handler;
export const POST = handler;
