import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext.jsx';
import Layout from './Layout.jsx';
import LoginPage from './pages/LoginPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import DepositPage from './pages/DepositPage.jsx';
import LedgerPage from './pages/LedgerPage.jsx';
import WithdrawalsPage from './pages/WithdrawalsPage.jsx';
import DeveloperApiPage from './pages/DeveloperApiPage.jsx';
import DeveloperApiReferencePage from './pages/DeveloperApiReferencePage.jsx';

function Shell() {
  const { user, ready } = useAuth();
  if (!ready) return <div className="auth-wrap"><div className="muted">Loading console…</div></div>;
  if (!user) return <LoginPage />;

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/deposit" element={<DepositPage />} />
        <Route path="/ledger" element={<LedgerPage />} />
        <Route path="/withdrawals" element={<WithdrawalsPage />} />
        <Route path="/developer" element={<DeveloperApiPage />} />
        <Route path="/developer/reference" element={<DeveloperApiReferencePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Shell />
    </AuthProvider>
  );
}
