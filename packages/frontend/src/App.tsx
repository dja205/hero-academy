import { Routes, Route, Navigate } from 'react-router-dom';

// Placeholder page components — to be implemented by Magni/Modi
const ChildPortal = () => (
  <div className="min-h-screen bg-city-dark flex items-center justify-center">
    <h1 className="text-4xl font-hero text-hero-red">Hero Academy — Child Portal</h1>
  </div>
);

const ParentPortal = () => (
  <div className="min-h-screen bg-city-dark flex items-center justify-center">
    <h1 className="text-4xl font-hero text-hero-blue">Hero Academy — Parent Portal</h1>
  </div>
);

const AdminPortal = () => (
  <div className="min-h-screen bg-city-dark flex items-center justify-center">
    <h1 className="text-4xl font-hero text-hero-purple">Hero Academy — Admin Portal</h1>
  </div>
);

export default function App() {
  return (
    <Routes>
      <Route path="/child/*" element={<ChildPortal />} />
      <Route path="/parent/*" element={<ParentPortal />} />
      <Route path="/admin/*" element={<AdminPortal />} />
      <Route path="/" element={<Navigate to="/parent" replace />} />
    </Routes>
  );
}
