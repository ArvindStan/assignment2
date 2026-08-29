import { BrowserRouter, Routes, Route } from "react-router-dom";
import JobCreation from "./pages/JobCreation";
import CandidateInterview from "./pages/CandidateInterview";
import InterviewResult from "./pages/InterviewResult";

function App() {
return ( <BrowserRouter> <Routes>
<Route
path="/"
element={<JobCreation />}
/>


            <Route
                path="/interview/:token"
                element={<CandidateInterview />}
            />

            <Route
                path="/interview/:token/result"
                element={<InterviewResult />}
            />
        </Routes>
    </BrowserRouter>
);


}

export default App;
