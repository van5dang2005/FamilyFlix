import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Auth/Login';
import ProfileSelection from './pages/ProfileSelection';
import Home from './pages/Home';
import VideoPlayer from './pages/VideoPlayer';
import PhotoGallery from './pages/PhotoGallery';
import Search from './pages/Search';
import ContentDetail from './pages/ContentDetail';
import Settings from './pages/Settings';
import Admin from './pages/Admin/Admin';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from './context/AuthContext';
import GuestRoute from './routes/GuestRoute';
import ProtectedRoute from './routes/ProtectedRoute';
import Register from './pages/Auth/Register';

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Routes>
            <Route element={<GuestRoute />}>
              <Route path="/" element={<Login />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
            </Route>
            <Route element={<ProtectedRoute />}>
              <Route path="/profiles" element={<ProfileSelection />} />
              <Route path="/home" element={<Home />} />
              <Route path="/watch/:id" element={<VideoPlayer />} />
              <Route path="/album/:id" element={<PhotoGallery />} />
              <Route path="/search" element={<Search />} />
              <Route path="/content/:id" element={<ContentDetail />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/admin" element={<Admin />} /> 
            </Route>
            
          </Routes>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}
