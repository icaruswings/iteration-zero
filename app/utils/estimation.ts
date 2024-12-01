import { api } from "convex/_generated/api";
import { Id } from "convex/_generated/dataModel";
import { ConvexReactClient } from "convex/react";

export async function createEstimationSession({
  iterationId,
  managerId,
  managerName,
  convex,
}: {
  iterationId: Id<"iterations">;
  managerId: string;
  managerName: string;
  convex: ConvexReactClient;
}) {  
  return await convex.mutation(api.estimationSessions.create, {
    iterationId,
    managerId,
    managerName,
  });
}
