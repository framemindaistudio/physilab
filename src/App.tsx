import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import Home from '@/pages/Home'

const Dashboard = lazy(() => import('@/pages/Dashboard'))
const Experiments = lazy(() => import('@/pages/Experiments'))
const ExperimentPage = lazy(() => import('@/pages/ExperimentPage'))
const VirtualLab = lazy(() => import('@/pages/VirtualLab'))
const Theory = lazy(() => import('@/pages/Theory'))
const Notebook = lazy(() => import('@/pages/Notebook'))
const Viva = lazy(() => import('@/pages/Viva'))
const Progress = lazy(() => import('@/pages/Progress'))
const About = lazy(() => import('@/pages/About'))
const NotFound = lazy(() => import('@/pages/NotFound'))

export default function App() {
  return (
    <AppShell>
      <Suspense fallback={<div className="py-20 text-center text-sm text-ink-3">Loading…</div>}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/experiments" element={<Experiments />} />
          <Route path="/experiments/:id" element={<ExperimentPage />} />
          <Route path="/experiments/:id/:stage" element={<ExperimentPage />} />
          <Route path="/lab" element={<VirtualLab />} />
          <Route path="/lab/:id" element={<VirtualLab />} />
          <Route path="/theory" element={<Theory />} />
          <Route path="/notebook" element={<Notebook />} />
          <Route path="/viva" element={<Viva />} />
          <Route path="/progress" element={<Progress />} />
          <Route path="/about" element={<About />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </AppShell>
  )
}
