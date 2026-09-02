import JobCreation from "./pages/JobCreation";
import CandidateInterview from "./pages/CandidateInterview";
import InterviewResult from "./pages/InterviewResult";
import RecruiterDashboard from "./pages/RecruiterDashboard";
import InterviewDetail from "./pages/InterviewDetail";


function App() {
    const path = window.location.pathname;


    /*
     * Recruiter Interview Detail
     *
     * URL:
     * /recruiter/interviews/<interview_id>
     *
     * This check must come BEFORE the general
     * /recruiter route.
     */
    if (
        path.startsWith("/recruiter/interviews/")
    ) {
        const parts = path.split("/");
        const interviewId = parts[3];

        if (interviewId) {
            return (
                <InterviewDetail
                    interviewId={interviewId}
                />
            );
        }
    }


    /*
     * Recruiter Dashboard
     *
     * URL:
     * /recruiter
     */
    if (path === "/recruiter" || path === "/recruiter/") {
        return <RecruiterDashboard />;
    }


    /*
     * Interview Result
     *
     * URL:
     * /interview/<token>/result
     *
     * This check must come BEFORE the normal
     * candidate interview route, otherwise
     * "result" would be treated as part of the token route.
     */
    if (
        path.startsWith("/interview/") &&
        path.endsWith("/result")
    ) {
        const parts = path.split("/");
        const token = parts[2];

        if (token) {
            return (
                <InterviewResult
                    token={token}
                />
            );
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
            return (
                <CandidateInterview
                    token={token}
                />
            );
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