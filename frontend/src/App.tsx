import { BrowserRouter, Navigate, Route, Routes, useParams } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { AuthProvider } from "./contexts/AuthContext";
import { RequireAuth } from "./components/RequireAuth";
import { RequireAdmin } from "./components/RequireAdmin";
import { AppShell } from "./components/layout/AppShell";
import { AdminLayout } from "./components/layout/AdminLayout";
import { PublicLayout } from "./components/layout/PublicLayout";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { AnalyzePage } from "./pages/AnalyzePage";
import { ConsultationsPage } from "./pages/ConsultationsPage";
import { ConsultationDetailPage } from "./pages/ConsultationDetailPage";
import { ConsultationFaqPage } from "./pages/ConsultationFaqPage";
import { ProfilePage } from "./pages/ProfilePage";
import { EducationPage } from "./pages/EducationPage";
import { EducationDetailPage } from "./pages/EducationDetailPage";
import { ProductsPage } from "./pages/ProductsPage";
import { AboutPage } from "./pages/AboutPage";
import { AdminDashboardPage } from "./pages/AdminDashboardPage";
import { AdminUsersPage } from "./pages/AdminUsersPage";
import { AdminProductsPage } from "./pages/AdminProductsPage";
import { AdminEducationPage } from "./pages/AdminEducationPage";
import { AdminDermatologistsPage } from "./pages/AdminDermatologistsPage";
import { DoctorsPage } from "./pages/DoctorsPage";

function ConsultationLegacyChatRedirect() {
  const { id } = useParams<{ id: string }>();
  if (!id) return <Navigate to="/app/consultations" replace />;
  return <Navigate to={`/app/consultations/${id}/faq`} replace />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <Toaster
            toastOptions={{
              duration: 4200,
              style: {
                background: "#2d6a6a",
                color: "#fafafa",
                borderRadius: "14px",
                fontSize: "0.875rem",
              },
            }}
          />
          <Routes>
            <Route element={<PublicLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/conditions" element={<EducationPage />} />
              <Route path="/conditions/:slug" element={<EducationDetailPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
            </Route>

            <Route
              path="/app"
              element={
                <RequireAuth>
                  <AppShell />
                </RequireAuth>
              }
            >
              <Route index element={<Navigate to="consultations" replace />} />
              <Route path="analyze" element={<AnalyzePage />} />
              <Route path="consultations" element={<ConsultationsPage />} />
              <Route path="consultations/:id" element={<ConsultationDetailPage />} />
              <Route path="consultations/:id/faq" element={<ConsultationFaqPage />} />
              <Route path="consultations/:id/chat" element={<ConsultationLegacyChatRedirect />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="products" element={<ProductsPage />} />
              <Route path="doctors" element={<DoctorsPage />} />
              <Route
                path="admin"
                element={
                  <RequireAdmin>
                    <AdminLayout />
                  </RequireAdmin>
                }
              >
                <Route index element={<Navigate to="stats" replace />} />
                <Route path="stats" element={<AdminDashboardPage />} />
                <Route path="users" element={<AdminUsersPage />} />
                <Route path="products" element={<AdminProductsPage />} />
                <Route path="education" element={<AdminEducationPage />} />
                <Route path="dermatologists" element={<AdminDermatologistsPage />} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
