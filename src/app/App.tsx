import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router';
import { GRADES } from '@/core/catalog';
import { Layout } from './Layout';
import { About } from './pages/About';
import { GradePage } from './pages/GradePage';
import { Home } from './pages/Home';
import { NotFound } from './pages/NotFound';
import { Privacy } from './pages/Privacy';
import { ToolPage } from './pages/ToolPage';

// Trang thử khung in, chỉ có khi chạy `npm run dev`.
const PrintDemo = import.meta.env.DEV ? lazy(() => import('./dev/PrintDemo')) : null;

export function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        {GRADES.map((grade) => (
          <Route key={grade.path} path={grade.path} element={<GradePage grade={grade.id} />} />
        ))}
        <Route path="/gioi-thieu" element={<About />} />
        <Route path="/quyen-rieng-tu" element={<Privacy />} />
        {PrintDemo && (
          <Route
            path="/_khung-thu"
            element={
              <Suspense fallback={null}>
                <PrintDemo />
              </Suspense>
            }
          />
        )}
        <Route path="/:slug" element={<ToolPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Layout>
  );
}
