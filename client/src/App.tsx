import { Suspense, lazy } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { GuestRoute } from './components/GuestRoute';
import { Loader } from './components/Loader';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { AppLayout } from './layouts/AppLayout';

// Route-level code splitting: each page ships in its own chunk and is
// fetched on first navigation instead of one eager bundle.
const LoginPage = lazy(() =>
  import('./pages/LoginPage').then((m) => ({ default: m.LoginPage }))
);
const SignupPage = lazy(() =>
  import('./pages/SignupPage').then((m) => ({ default: m.SignupPage }))
);
const HomePage = lazy(() =>
  import('./pages/HomePage').then((m) => ({ default: m.HomePage }))
);
const TemporaryRoomsPage = lazy(() =>
  import('./pages/TemporaryRoomsPage').then((m) => ({ default: m.TemporaryRoomsPage }))
);
const SecureChatsListPage = lazy(() =>
  import('./pages/SecureChatsListPage').then((m) => ({ default: m.SecureChatsListPage }))
);
const ChatRoomPage = lazy(() =>
  import('./pages/ChatRoomPage').then((m) => ({ default: m.ChatRoomPage }))
);
const SecureChatPage = lazy(() =>
  import('./pages/SecureChatPage').then((m) => ({ default: m.SecureChatPage }))
);
const ThemePage = lazy(() =>
  import('./pages/ThemePage').then((m) => ({ default: m.ThemePage }))
);
const AccountPage = lazy(() =>
  import('./pages/AccountPage').then((m) => ({ default: m.AccountPage }))
);

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Suspense
            fallback={
              <div className="flex min-h-dvh items-center justify-center bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-white">
                <Loader size="lg" />
              </div>
            }
          >
            <Routes>
              <Route element={<GuestRoute />}>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />
              </Route>

              <Route element={<ProtectedRoute />}>
                <Route element={<AppLayout />}>
                  <Route path="/" element={<Navigate to="/home" replace />} />
                  <Route path="/home" element={<HomePage />} />
                  <Route path="/rooms" element={<TemporaryRoomsPage />} />
                  <Route path="/secure-chats" element={<SecureChatsListPage />} />
                  <Route path="/theme" element={<ThemePage />} />
                  <Route path="/account" element={<AccountPage />} />
                </Route>
                <Route path="/rooms/:roomId" element={<ChatRoomPage />} />
                <Route path="/secure-chats/:chatId" element={<SecureChatPage />} />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
