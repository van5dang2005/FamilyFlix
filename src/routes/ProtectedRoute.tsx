import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'


const ProtectedRoute = () => {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return <div>Loading...</div>
  }
  // 1️⃣ Chưa login -> Đá về trang login
  if (!isAuthenticated) {
    return <Navigate to="/" replace />
  }
 
  return <Outlet />
}

export default ProtectedRoute