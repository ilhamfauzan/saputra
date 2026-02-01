import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import HistoricalData from './pages/HistoricalData';
import PurchasePlan from './pages/PurchasePlan';
import ProductManagement from './pages/ProductManagement';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
import POS from './pages/POS';
import Suppliers from './pages/Suppliers';
import Employees from './pages/Employees';
import { useAuth } from './contexts/AuthContext';
import { SupplierProvider } from './contexts/SupplierContext';
import { TransactionProvider } from './contexts/TransactionContext';
import { ProductProvider } from './contexts/ProductContext';

const App: React.FC = () => {
  return (
    <ProductProvider>
      <TransactionProvider>
        <SupplierProvider>
          <Router>
            <Routes>
              <Route path="/login" element={<Login />} />

              {/* Employee routes */}
              <Route element={<ProtectedRoute allowedRoles={['employee']} />}>
                <Route path="/pos" element={<Layout><POS /></Layout>} />
                <Route path="/products" element={<Layout><ProductManagement /></Layout>} />
                <Route path="/suppliers" element={<Layout><Suppliers /></Layout>} />
              </Route>

              {/* Owner-only routes */}
              <Route element={<ProtectedRoute allowedRoles={['owner']} />}>
                <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
                <Route path="/plan" element={<Layout><PurchasePlan /></Layout>} />
                <Route path="/data" element={<Layout><HistoricalData /></Layout>} />
                <Route path="/employees" element={<Layout><Employees /></Layout>} />
              </Route>

              {/* Default route - redirect based on role */}
              <Route path="/" element={<RoleBasedRedirect />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Router>
        </SupplierProvider>
      </TransactionProvider>
    </ProductProvider>
  );
};

// Component to handle role-based redirection
const RoleBasedRedirect: React.FC = () => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === 'owner') {
    return <Navigate to="/dashboard" replace />;
  } else {
    return <Navigate to="/pos" replace />;
  }
};

export default App;