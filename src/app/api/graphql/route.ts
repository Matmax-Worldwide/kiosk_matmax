import { ApolloServer } from '@apollo/server';
import { startServerAndCreateNextHandler } from '@as-integrations/next';
import { NextRequest, NextResponse } from 'next/server';

import typeDefs from '../_schema.js';
import resolvers from '../_resolvers.js';

interface GraphQLError {
  message: string;
  path?: string[];
  extensions?: {
    code?: string;
    [key: string]: unknown;
  };
}

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
    const graphqlError = error as GraphQLError;
    console.error('GraphQL Error:', {
      message: graphqlError.message,
      path: graphqlError.path,
      extensions: graphqlError.extensions
    });
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
