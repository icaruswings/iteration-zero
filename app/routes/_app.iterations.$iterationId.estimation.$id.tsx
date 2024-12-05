import { useParams } from "@remix-run/react";
import { useMutation, useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import { useState, useEffect } from "react";
import { useUser } from "@clerk/remix";
import { Id } from "convex/_generated/dataModel";
import invariant from "tiny-invariant";

export default function EstimationSession() {
  const { iterationId, id } = useParams<{ iterationId: Id<"iterations">; id: Id<"estimationSessions"> }>();
  invariant(!!iterationId, "iterationId is required");
  invariant(!!id, "id is required");

  const { user } = useUser();
  const [estimationFilter, setEstimationFilter] = useState("all");
  const [estimate, setEstimate] = useState(0);

  // All hooks must be called unconditionally at the top level
  const session = useQuery(api.estimationSessions.get,
    { id }
  );
  
  const availableTasks = useQuery(
    api.tasks.list,
    { iterationId }
  );

  const task = useQuery(
    api.tasks.get,
    session?.currentTaskId ? {
      iterationId: iterationId,
      id: session.currentTaskId
    } : "skip" 
  );

  const allEstimates = useQuery(
    api.estimationSessions.getEstimates,
    session?.currentTaskId ? { id: session._id, taskId: session.currentTaskId } : "skip"
  );

  const allTaskEstimates = useQuery(
    api.estimationSessions.getAllTaskEstimates,
    session?.iterationId ? { iterationId: session.iterationId } : "skip"
  );

  const joinSession = useMutation(api.estimationSessions.joinSession);
  const submitEstimate = useMutation(api.estimationSessions.submitEstimates);
  const lockEstimates = useMutation(api.estimationSessions.lockEstimates);
  const unlockEstimates = useMutation(api.estimationSessions.unlockEstimates);
  const saveFinalEstimates = useMutation(api.estimationSessions.saveFinalEstimates);
  const selectTask = useMutation(api.estimationSessions.selectTask);

  useEffect(() => {
    if (!user) return;
    
    if (session && !session.participants.find(p => p.userId === user.id)) {
      joinSession({ id: session._id });
    }
  }, [user, session]);

  if (!user || !session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Loading...</h1>
          <p className="text-gray-600">Please wait while we set up your session</p>
        </div>
      </div>
    );
  }

  const isManager = session.createdBy === user.id;
  const currentEstimate = allEstimates?.find(e => e.participantId === user.id);
  const averageEstimate = allEstimates && allEstimates.length > 0
    ? allEstimates.reduce((acc, curr) => acc + curr.estimate, 0) / allEstimates.length
    : 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">Estimation Session</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Share this URL with your team: {window.location.href}
        </p>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">Participants</h2>
        <div className="flex flex-wrap gap-2">
          {session.participants.map((p) => {
            const hasSubmitted = allEstimates?.some(
              (e) => e.participantId === p.userId
            );
            return (
              <div
                key={p.userId}
                className={`flex items-center px-3 py-1 rounded-full text-sm ${
                  hasSubmitted
                    ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                }`}
              >
                <div className="flex items-center gap-1">
                  {p.userId === user.id ? "Me" : p.name}
                  {p.userId === session.createdBy && (
                    <span className={`ml-1 ${
                      hasSubmitted
                        ? "text-green-600 dark:text-green-300"
                        : "text-gray-500 dark:text-gray-400"
                    }`}>
                      (Manager)
                    </span>
                  )}
                  {hasSubmitted && (
                    <svg
                      className="w-4 h-4 ml-1 text-green-600 dark:text-green-300"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path d="M5 13l4 4L19 7"></path>
                    </svg>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {isManager && !task && (
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Select a Task to Estimate</h2>
            <select
              value={estimationFilter}
              onChange={(e) => setEstimationFilter(e.target.value)}
              className="px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600"
            >
              <option value="all">All Tasks</option>
              <option value="estimated">Estimated Tasks</option>
              <option value="not-estimated">Not Estimated Tasks</option>
            </select>
          </div>
          {!availableTasks ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="text-center text-gray-600 dark:text-gray-400 mt-2">Loading tasks...</p>
            </div>
          ) : availableTasks.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <p className="text-center text-gray-600 dark:text-gray-400">No tasks available for estimation.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {availableTasks
                .filter(t => {
                  const hasEstimates = allTaskEstimates?.some(e => e.taskId === t._id);
                  if (estimationFilter === "estimated") return hasEstimates;
                  if (estimationFilter === "not-estimated") return !hasEstimates;
                  return true;
                })
                .map((t) => (
                  <button
                    key={t._id}
                    onClick={() => selectTask({
                      id: session._id,
                      taskId: t._id,
                    })}
                    className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow hover:shadow-md transition-shadow text-left"
                  >
                    <h3 className="font-medium text-gray-800 dark:text-gray-100">{t.title}</h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">{t.description}</p>
                    <div className="mt-2">
                      <span className={`inline-block px-2 py-1 text-sm rounded ${
                        t.priority === "High" 
                          ? "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100"
                          : t.priority === "Medium"
                          ? "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-100"
                          : "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100"
                      }`}>
                        {t.priority}
                      </span>
                    </div>
                  </button>
                ))}
            </div>
          )}
        </div>
      )}

      {task ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Current Task</h2>
            {isManager && (
              <div className="relative">
                <button
                  onClick={async () => {
                    if (session.currentTaskStatus === "active" && allEstimates && allEstimates.length > 0) {
                      // Calculate averages
                      const avgEstimate = allEstimates.reduce(
                        (acc, curr) => acc + curr.estimate,
                        0
                      ) / allEstimates.length;
                      
                      // Save final estimates
                      await saveFinalEstimates({
                        id: session._id,
                        taskId: task._id,
                        estimate: avgEstimate,
                      });

                      // Lock the session
                      await lockEstimates({
                        id: session._id,
                      });
                        
                    } else if (session.currentTaskStatus === "locked") {
                      await unlockEstimates({
                        id: session._id,
                      });
                    }
                  }}
                  className={`p-2 rounded-md text-sm font-medium ${
                    session.currentTaskStatus === "active"
                      ? allEstimates && allEstimates.length > 0
                        ? "bg-yellow-500 hover:bg-yellow-600 text-white"
                        : "bg-yellow-300 cursor-not-allowed text-white"
                      : "bg-green-500 hover:bg-green-600 text-white"
                  }`}
                  disabled={session.currentTaskStatus === "active" && (!allEstimates || allEstimates.length === 0)}
                >
                  {session.currentTaskStatus === "active" ? (
                    allEstimates && allEstimates.length > 0 ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                      </svg>
                    )
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  )}
                </button>
              </div>
            )}
          </div>
          <div className="mb-4">
            <h3 className="font-medium text-gray-800 dark:text-gray-100">{task.title}</h3>
            <p className="text-gray-600 dark:text-gray-400">{task.description}</p>
          </div>

          {session.currentTaskStatus === "active" && (
            <div className="space-y-4">
              {isManager ? (
                <div>
                  <label className="block text-base font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Average Estimate (days)
                  </label>
                  <div className="block w-full text-center text-2xl font-medium h-16 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 flex items-center justify-center">
                    {averageEstimate}
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-base font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Estimate (days)
                  </label>
                  <input
                    type="number"
                    min="0.5"
                    step="0.5"
                    value={estimate || currentEstimate?.estimate || 0}
                    onChange={(e) => setEstimate(parseFloat(e.target.value))}
                    className="block w-full text-center text-2xl font-medium h-16 rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
                  />
                </div>
              )}

              {!isManager && (
                <button
                  onClick={() =>
                    submitEstimate({
                      id: session._id,
                      taskId: task._id,
                      estimate,
                    })
                  }
                  className="mt-8 w-full bg-blue-500 text-white p-4 text-lg font-medium rounded-lg hover:bg-blue-600 dark:hover:bg-blue-500 transition-colors"
                >
                  Submit Estimate
                </button>
              )}
            </div>
          )}

          {isManager && session.currentTaskStatus === "active" && allEstimates && allEstimates.length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100">Submitted Estimates</h3>
              <div className="space-y-4">
                {allEstimates
                  .filter(estimate => {
                    const participant = session.participants.find(p => p.userId === estimate.participantId);
                    return participant?.userId !== session.createdBy;
                  })
                  .map((estimate) => {
                    const participant = session.participants.find(
                      (p) => p.userId === estimate.participantId
                    );
                    return (
                      <div
                        key={estimate._id}
                        className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-gray-800 dark:text-gray-100">
                            {participant?.userId === user.id ? "Me" : participant?.name}
                          </span>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {new Date(estimate.createdAt).toLocaleTimeString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600 dark:text-gray-400">Estimate:</span>
                          <span className="ml-2 text-gray-800 dark:text-gray-100">{estimate.estimate} days</span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {session.currentTaskStatus === "locked" && allEstimates && (
            <div className="mt-8">
              <h3 className="font-medium text-gray-800 dark:text-gray-100 mb-2">Final Estimate</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Days
                </label>
                <div className="mt-1 text-lg text-gray-800 dark:text-gray-100">{averageEstimate}</div>
              </div>
              {isManager && (
                <button
                  onClick={async () => {
                    if (averageEstimate) {
                      await saveFinalEstimates({
                        id: session._id,
                        taskId: task._id,
                        estimate: averageEstimate,
                      });
                    }
                    await selectTask({
                      id: session._id,
                      taskId: null
                    });
                  }}
                  className="mt-6 w-full bg-blue-500 text-white p-4 text-lg font-medium rounded-lg hover:bg-blue-600 dark:hover:bg-blue-500 transition-colors"
                >
                  Save and Select Next Task
                </button>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">
            {isManager ? "Task Selection" : "Waiting for Task Selection"}
          </h2>
          {isManager ? (
            availableTasks === null ? (
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                <p className="text-gray-600 dark:text-gray-400">Loading available tasks...</p>
              </div>
            ) : (
              <p className="text-gray-600 dark:text-gray-400">Please select a task above to begin estimation.</p>
            )
          ) : (
            <p className="text-gray-600 dark:text-gray-400">The session manager will select a task to estimate.</p>
          )}
        </div>
      )}
    </div>
  );
}
