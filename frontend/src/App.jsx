import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { SocketProvider } from './context/SocketContext'
import LoginPage from './pages/Login/LoginPage'
import RegisterPage from './pages/Register/RegisterPage'
import HomePage from './pages/Home/HomePage'
import ProfilePage from './pages/Profile/ProfilePage'
import FriendRequestsPage from './pages/FriendRequestsPage'
import ConversationsPage from './pages/ConversationsPage'
import ChatPage from './pages/ChatPage'
import SearchUsersPage from './pages/SearchUsersPage'
import HashtagPage from './pages/HashtagPage'
import ExplorePage from './pages/ExplorePage'
import SocketStatusBanner from './components/SocketStatusBanner'
import './App.css'

function RequireAuth({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return <div>Carregando...</div>
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return children
}

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <SocketProvider>
          <SocketStatusBanner />
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route
                path="/"
                element={
                  <RequireAuth>
                    <HomePage />
                  </RequireAuth>
                }
              />
              <Route
                path="/profile"
                element={
                  <RequireAuth>
                    <ProfilePage />
                  </RequireAuth>
                }
              />
              <Route
                path="/profile/:username"
                element={
                  <RequireAuth>
                    <ProfilePage />
                  </RequireAuth>
                }
              />
              <Route
                path="/search"
                element={
                  <RequireAuth>
                    <SearchUsersPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/explore"
                element={
                  <RequireAuth>
                    <ExplorePage />
                  </RequireAuth>
                }
              />
              <Route
                path="/hashtags/:tag"
                element={
                  <RequireAuth>
                    <HashtagPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/requests"
                element={
                  <RequireAuth>
                    <FriendRequestsPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/conversations"
                element={
                  <RequireAuth>
                    <ConversationsPage />
                  </RequireAuth>
                }
              />
              <Route
                path="/chat/:friendId"
                element={
                  <RequireAuth>
                    <ChatPage />
                  </RequireAuth>
                }
              />
            </Routes>
          </BrowserRouter>
        </SocketProvider>
      </ThemeProvider>
    </AuthProvider>
  )
}

export default App
