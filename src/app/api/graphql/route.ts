import { ApolloServer } from '@apollo/server';
import { startServerAndCreateNextHandler } from '@as-integrations/next';
import { NextRequest, NextResponse } from 'next/server';

import typeDefs from '../_schema.js';
import resolvers from '../_resolvers.js';

const server = new ApolloServer({
  typeDefs,
  resolvers,
});

const handler = startServerAndCreateNextHandler(server, {
  context: async (req) => {
    return {
      req,
    };
  },
});

export async function POST(req: NextRequest) {
  try {
    const response = await handler(req);
    return response;
  } catch (error) {
    console.error('GraphQL Error:', error);
    return NextResponse.json(
      { 
        errors: [{ 
          message: 'Internal server error',
          extensions: { code: 'INTERNAL_SERVER_ERROR' } 
        }] 
      },
      { status: 500 }
    );
  }
}
