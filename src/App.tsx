import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { RazorGateProvider } from './context/RazorGateContext';
import { ToastProvider } from './context/ToastContext';
import { ToastContainer } from './components/common/Toast';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { AppShell } from './components/layout/AppShell';

// Auth pages
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';

// Dashboard screens
import { CommandCenter } from './components/screens/CommandCenter';
import { AiBuyer } from './components/screens/AiBuyer';
import { MerchantCatalogScreen } from './components/screens/MerchantCatalogScreen';
import { TransactionGuardScreen } from './components/screens/TransactionGuardScreen';
import { ApprovalCenterScreen } from './components/screens/ApprovalCenterScreen';
import { TransactionsScreen } from './components/screens/TransactionsScreen';
import { AuditTrailScreen } from './components/screens/AuditTrailScreen';
import { PoliciesScreen } from './components/screens/PoliciesScreen';

// Settings pages
import { AccountPage } from './pages/AccountPage';
import { SpendingControlsPage } from './pages/SpendingControlsPage';
import { PaymentSettingsPage } from './pages/PaymentSettingsPage';
import { SecurityPage } from './pages/SecurityPage';

// Modals (rendered globally inside AppShell)
import { RazorpayCheckoutModal } from './components/modals/RazorpayCheckoutModal';
import { TransactionDrawer } from './components/modals/TransactionDrawer';
import { EditIntentModal } from './components/modals/EditIntentModal';
import { PaymentFailureModal } from './components/modals/PaymentFailureModal';

const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AppShell>
    {children}
    <RazorpayCheckoutModal />
    <TransactionDrawer />
    <EditIntentModal />
    <PaymentFailureModal />
  </AppShell>
);

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <RazorGateProvider>
            <ToastContainer />
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />

              {/* Protected routes */}
              <Route element={<ProtectedRoute />}>
                <Route path="/command-center" element={<DashboardLayout><CommandCenter /></DashboardLayout>} />
                <Route path="/ai-buyer" element={<DashboardLayout><AiBuyer /></DashboardLayout>} />
                <Route path="/catalog" element={<DashboardLayout><MerchantCatalogScreen /></DashboardLayout>} />
                <Route path="/guard" element={<DashboardLayout><TransactionGuardScreen /></DashboardLayout>} />
                <Route path="/approvals" element={<DashboardLayout><ApprovalCenterScreen /></DashboardLayout>} />
                <Route path="/transactions" element={<DashboardLayout><TransactionsScreen /></DashboardLayout>} />
                <Route path="/audit" element={<DashboardLayout><AuditTrailScreen /></DashboardLayout>} />
                <Route path="/policies" element={<DashboardLayout><PoliciesScreen /></DashboardLayout>} />

                {/* Settings */}
                <Route path="/account" element={<DashboardLayout><AccountPage /></DashboardLayout>} />
                <Route path="/settings/spending" element={<DashboardLayout><SpendingControlsPage /></DashboardLayout>} />
                <Route path="/settings/payments" element={<DashboardLayout><PaymentSettingsPage /></DashboardLayout>} />
                <Route path="/settings/security" element={<DashboardLayout><SecurityPage /></DashboardLayout>} />
              </Route>

              {/* Default redirect */}
              <Route path="/" element={<Navigate to="/command-center" replace />} />
              <Route path="*" element={<Navigate to="/command-center" replace />} />
            </Routes>
          </RazorGateProvider>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
