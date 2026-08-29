import JobCreation from "./pages/JobCreation";
import CandidateInterview from "./pages/CandidateInterview";
import InterviewResult from "./pages/InterviewResult";

function App() {
    const path = window.location.pathname;

    /*
     * Interview Result
     *
     * URL:
     * /interview/<token>/result
     *
     * This check must come BEFORE the normal interview route,
     * otherwise /result would be treated as the token.
     */
    if (
        path.startsWith("/interview/") &&
        path.endsWith("/result")
    ) {
        const parts = path.split("/");
        const token = parts[2];

        if (token) {
            return <InterviewResult token={token} />;
        }
    }

    /*
     * Candidate Interview
     *
     * URL:
     * /interview/<token>
     */
    if (path.startsWith("/interview/")) {
        const parts = path.split("/");
        const token = parts[2];

        if (token) {
            return <CandidateInterview token={token} />;
        }
    }

    /*
     * Default route
     *
     * URL:
     * /
     */
    return <JobCreation />;
}

export default App;

