import { client } from "@/lib/apolloClient";
import { GET_HORARIOS } from "@/lib/graphql/queries";

export async function fetchHorarios() {
  try {
    const { data } = await client.query({
      query: GET_HORARIOS,
      variables: { contextId: "ec966559-0580-4adb-bc6b-b150c56f935c" }
    });
    return data.allocations;
  } catch (error) {
    console.error("Error fetching horarios:", error);
    throw error;
  }
} 