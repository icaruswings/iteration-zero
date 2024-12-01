import { useParams } from "@remix-run/react";
import { useMutation, useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import { useState, useEffect } from "react";
import { nanoid } from "nanoid";

export default function EstimationSession() {
  const { sessionUrl } = useParams();
  const [participantId, setParticipantId] = useState("");
  const [participantName, setParticipantName] = useState("");
  const [showNamePrompt, setShowNamePrompt] = useState(true);
  const [estimates, setEstimates] = useState({
    bestCase: 0,
    likelyCase: 0,
    worstCase: 0,
  });

  // All hooks must be called unconditionally at the top level
  const session = useQuery(api.estimationSessions.getByUrl, { 
    sessionUrl: sessionUrl || "" 
  });
  
  const availableTasks = useQuery(
    api.tasks.listByIteration,
    session?.iterationId ? { iterationId: session.iterationId } : "skip"
  );

  const task = useQuery(
    api.tasks.get,
    session?.taskId ? { id: session.taskId } : "skip" 
  );

  const allEstimates = useQuery(
    api.estimationSessions.getEstimates,
    session?.taskId ? { sessionId: session._id, taskId: session.taskId } : "skip"
  );

  const joinSession = useMutation(api.estimationSessions.join);
  const submitEstimate = useMutation(api.estimationSessions.submitEstimate);
  const lockEstimates = useMutation(api.estimationSessions.lockEstimates);
  const selectTask = useMutation(api.estimationSessions.selectTask);

  // Initialize client-side state from sessionStorage
  useEffect(() => {
    const storedParticipantId = sessionStorage.getItem("participantId");
    const storedParticipantName = sessionStorage.getItem("participantName");
    
    setParticipantId(storedParticipantId || nanoid());
    setParticipantName(storedParticipantName || "");
    setShowNamePrompt(!storedParticipantName);
  }, []);

  useEffect(() => {
    if (participantId) {
      sessionStorage.setItem("participantId", participantId);
    }
  }, [participantId]);

  useEffect(() => {
    if (participantName) {
      sessionStorage.setItem("participantName", participantName);
    }
  }, [participantName]);

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading session...</p>
        </div>
      </div>
    );
  }

  const isManager = session.managerId === participantId;

  if (showNamePrompt) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-md w-full">
          <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-100">Enter your name</h2>
          <input
            type="text"
            value={participantName}
            onChange={(e) => setParticipantName(e.target.value)}
            className="w-full p-2 border rounded mb-4 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
            placeholder="Your name"
          />
          <button
            onClick={async () => {
              if (participantName.trim()) {
                await joinSession({
                  sessionUrl: sessionUrl || "",
                  participantId,
                  participantName: participantName.trim(),
                });
                setShowNamePrompt(false);
              }
            }}
            className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 dark:hover:bg-blue-500"
          >
            Join Session
          </button>
        </div>
      </div>
    );
  }

  const currentEstimate = allEstimates?.find(e => e.participantId === participantId);
  const averageEstimates = allEstimates?.reduce(
    (acc, curr) => ({
      bestCase: acc.bestCase + curr.bestCase,
      likelyCase: acc.likelyCase + curr.likelyCase,
      worstCase: acc.worstCase + curr.worstCase,
    }),
    { bestCase: 0, likelyCase: 0, worstCase: 0 }
  );

  if (averageEstimates && allEstimates) {
    averageEstimates.bestCase = Math.round(averageEstimates.bestCase / allEstimates.length * 10) / 10;
    averageEstimates.likelyCase = Math.round(averageEstimates.likelyCase / allEstimates.length * 10) / 10;
    averageEstimates.worstCase = Math.round(averageEstimates.worstCase / allEstimates.length * 10) / 10;
  }

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
              (e) => e.participantId === p.participantId
            );
            return (
              <div
                key={p.participantId}
                className={`flex items-center px-3 py-1 rounded-full text-sm ${
                  hasSubmitted
                    ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                }`}
              >
                <div className="flex items-center gap-1">
                  {p.name}
                  {p.participantId === session.managerId && (
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
          <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">Select a Task to Estimate</h2>
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
              {availableTasks.map((t) => (
                <button
                  key={t._id}
                  onClick={() => selectTask({
                    sessionId: session._id,
                    taskId: t._id,
                    managerId: participantId,
                  })}
                  className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow hover:shadow-md transition-shadow text-left"
                >
                  <h3 className="font-medium text-gray-800 dark:text-gray-100">{t.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">{t.description}</p>
                  <div className="mt-2">
                    <span className={`inline-block px-2 py-1 text-sm rounded ${
                      t.priority === "high" 
                        ? "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100"
                        : t.priority === "medium"
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
          <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-100">Current Task</h2>
          <div className="mb-4">
            <h3 className="font-medium text-gray-800 dark:text-gray-100">{task.title}</h3>
            <p className="text-gray-600 dark:text-gray-400">{task.description}</p>
          </div>

          {session.status === "active" && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <label className="block text-base font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Best (days)
                  </label>
                  <input
                    type="number"
                    min="0.5"
                    step="0.5"
                    value={estimates.bestCase || currentEstimate?.bestCase || 0}
                    onChange={(e) =>
                      setEstimates((prev) => ({
                        ...prev,
                        bestCase: parseFloat(e.target.value),
                      }))
                    }
                    className="block w-full text-center text-2xl font-medium h-16 rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-base font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Likely (days)
                  </label>
                  <input
                    type="number"
                    min="0.5"
                    step="0.5"
                    value={estimates.likelyCase || currentEstimate?.likelyCase || 0}
                    onChange={(e) =>
                      setEstimates((prev) => ({
                        ...prev,
                        likelyCase: parseFloat(e.target.value),
                      }))
                    }
                    className="block w-full text-center text-2xl font-medium h-16 rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-base font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Worst (days)
                  </label>
                  <input
                    type="number"
                    min="0.5"
                    step="0.5"
                    value={estimates.worstCase || currentEstimate?.worstCase || 0}
                    onChange={(e) =>
                      setEstimates((prev) => ({
                        ...prev,
                        worstCase: parseFloat(e.target.value),
                      }))
                    }
                    className="block w-full text-center text-2xl font-medium h-16 rounded-lg border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
                  />
                </div>
              </div>

              <button
                onClick={() =>
                  submitEstimate({
                    sessionId: session._id,
                    taskId: task._id,
                    participantId,
                    ...estimates,
                  })
                }
                className="mt-8 w-full bg-blue-500 text-white p-4 text-lg font-medium rounded-lg hover:bg-blue-600 dark:hover:bg-blue-500 transition-colors"
              >
                Submit Estimate
              </button>
            </div>
          )}

          {isManager && session.status === "active" && allEstimates && allEstimates.length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100">Submitted Estimates</h3>
              <div className="space-y-4">
                {allEstimates.map((estimate) => {
                  const participant = session.participants.find(
                    (p) => p.participantId === estimate.participantId
                  );
                  return (
                    <div
                      key={estimate._id}
                      className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-800 dark:text-gray-100">
                          {participant?.name}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {new Date(estimate._creationTime).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <span className="text-sm text-gray-600 dark:text-gray-400">Best:</span>
                          <span className="ml-2 text-gray-800 dark:text-gray-100">{estimate.bestCase} days</span>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600 dark:text-gray-400">Likely:</span>
                          <span className="ml-2 text-gray-800 dark:text-gray-100">{estimate.likelyCase} days</span>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600 dark:text-gray-400">Worst:</span>
                          <span className="ml-2 text-gray-800 dark:text-gray-100">{estimate.worstCase} days</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
                <h4 className="font-medium text-blue-800 dark:text-blue-100 mb-2">Current Average</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <span className="text-sm text-blue-600 dark:text-blue-300">Best:</span>
                    <span className="ml-2 text-blue-800 dark:text-blue-100">{averageEstimates?.bestCase} days</span>
                  </div>
                  <div>
                    <span className="text-sm text-blue-600 dark:text-blue-300">Likely:</span>
                    <span className="ml-2 text-blue-800 dark:text-blue-100">{averageEstimates?.likelyCase} days</span>
                  </div>
                  <div>
                    <span className="text-sm text-blue-600 dark:text-blue-300">Worst:</span>
                    <span className="ml-2 text-blue-800 dark:text-blue-100">{averageEstimates?.worstCase} days</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {isManager && session.status === "active" && (
            <div className="mt-4">
              <button
                onClick={() => lockEstimates({ 
                  sessionId: session._id, 
                  taskId: task._id, 
                  managerId: session.managerId, 
                  bestCase: averageEstimates?.bestCase ?? 0, 
                  likelyCase: averageEstimates?.likelyCase ?? 0, 
                  worstCase: averageEstimates?.worstCase ?? 0 
                })}
                className="w-full bg-yellow-500 text-white p-2 rounded hover:bg-yellow-600 dark:hover:bg-yellow-500"
              >
                Lock Estimates
              </button>
            </div>
          )}

          {session.status === "locked" && allEstimates && (
            <div className="mt-4">
              <h3 className="font-medium text-gray-800 dark:text-gray-100 mb-2">Final Estimates</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Best (days)
                  </label>
                  <div className="mt-1 text-lg text-gray-800 dark:text-gray-100">{averageEstimates?.bestCase}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Likely (days)
                  </label>
                  <div className="mt-1 text-lg text-gray-800 dark:text-gray-100">{averageEstimates?.likelyCase}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Worst (days)
                  </label>
                  <div className="mt-1 text-lg text-gray-800 dark:text-gray-100">{averageEstimates?.worstCase}</div>
                </div>
              </div>
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
