import { Routes, Route } from "react-router-dom"
import LoginPage from "../pages/LoginPage"
import ConnectedDiagramPage from "../pages/ConnectedDiagramPage"
// import DiagramOnlyPage from "../pages/DiagramOnlyPage"
import ProjectDashboard from "../pages/ProjectDashboard"
import InvitationPanel from "../components/dashboard/InvitationPanel"
import GenerationBackendSprintBoot from "../pages/GenerationBackendSprintBoot"
import ChatBotPage from "../pages/ChatBotPage"
import GenerationFrontendFlutter from "../pages/GenerationFrontendFlutter"
import StudentDashboardPage from "../pages/StudentDashboardPage"
import IndividualProgressPage from "../pages/IndividualProgressPage"
import CollaborationReportPage from "../pages/CollaborationReportPage"
import PendingProjectsReportPage from "../pages/PendingProjectsReportPage"
import DiagramEvolutionPage from "../pages/DiagramEvolutionPage"

const AppRoutes = () => {
    return (
        <Routes>
            <Route path="/" element={<LoginPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/dashboard" element={<ProjectDashboard />} />
            <Route path="/invitations" element={<InvitationPanel />} />
            <Route path="/projects/:projectId/invite" element={<InvitationPanel />} />
            <Route path="/diagram/:projectId" element={<ConnectedDiagramPage />} />
            <Route path="/generate/:projectId" element={<GenerationBackendSprintBoot />} />
            <Route path="/generate-frontend/:projectId" element={<GenerationFrontendFlutter />} />
            <Route path="/chatbot" element={<ChatBotPage />} />

            {/* Reportes */}
            <Route path="/reports/student-dashboard" element={<StudentDashboardPage />} />
            <Route path="/reports/individual-progress" element={<IndividualProgressPage />} />
            <Route path="/reports/collaboration/:projectId" element={<CollaborationReportPage />} />
            <Route path="/reports/pending-projects" element={<PendingProjectsReportPage />} />
            <Route path="/reports/diagram-evolution/:projectId" element={<DiagramEvolutionPage />} />
        </Routes>
    )
}

export default AppRoutes