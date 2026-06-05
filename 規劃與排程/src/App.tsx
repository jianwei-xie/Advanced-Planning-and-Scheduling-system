import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout';
import { Dashboard } from './components/dashboard';
import { ProductionLinePage } from './components/production';
import { ProductPage } from './components/product';
import { OrderPage } from './components/order';
import { MaterialPage } from './components/replenishment';
import { BasicDataPage, SettingsPage } from './pages';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="basic-data" element={<BasicDataPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
