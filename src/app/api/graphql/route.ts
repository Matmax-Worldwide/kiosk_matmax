import { ApolloServer } from '@apollo/server';
import { startServerAndCreateNextHandler } from '@as-integrations/next';
import { NextRequest } from 'next/server';

import typeDefs from '../_schema.js';
import resolvers from '../_resolvers.js';

const server = new ApolloServer({
  typeDefs,
  resolvers,
});

// Create handler with basic context
const handler = startServerAndCreateNextHandler(server);

// Export route handlers with proper Next.js App Router types
export async function GET(req: NextRequest) {
  return handler(req);
}

export async function POST(req: NextRequest) {
  return handler(req);
}
