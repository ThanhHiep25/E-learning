import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import Home from './pages/Home';
import Courses from './pages/Courses';
import CourseDetails from './pages/CourseDetails';
import LessonPlayer from './pages/LessonPlayer';
import Payment from './pages/Payment';
import Profile from './pages/Profile';
import LearningSchedule from './pages/LearningSchedule';
import EnrollmentList from './pages/EnrollmentList';
import MyLearning from './pages/MyLearning';
import MyTests from './pages/MyTests';
import Login from './pages/Login';
import ResetPassword from './pages/ResetPassword';
import TakeQuiz from './pages/TakeQuiz';
import Notifications from './pages/Notifications';
import Forum from './pages/Forum';
import TopicDetails from './pages/TopicDetails';
import NewTopic from './pages/NewTopic';
import ForumReports from './pages/ForumReports';
import AIChatPage from './pages/student/AIChatPage';
import TeacherDashboard from './pages/teacher/Dashboard';
import StudentManagement from './pages/teacher/StudentManagement';
import QuizManagement from './pages/teacher/QuizManagement';
import QuizQuestionEditor from './pages/teacher/QuizQuestionEditor';
import QuizAttempts from './pages/teacher/QuizAttempts';
import TeacherStatistics from './pages/teacher/Statistics';
import TeacherLayout from './components/layout/TeacherLayout';
import AdminLayout from './components/layout/AdminLayout';
import CourseEditor from './pages/teacher/CourseEditor';
import ContentEditor from './pages/teacher/ContentEditor';
import TeacherCourses from './pages/teacher/TeacherCourses';
import TeacherSchedule from './pages/teacher/TeacherSchedule';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminCourses from './pages/admin/AdminCourses';
import AdminPayments from './pages/admin/AdminPayments';
import AdminReviews from './pages/admin/AdminReviews';
import AdminCategories from './pages/admin/AdminCategories';
import AdminAiSettings from './pages/admin/AdminAiSettings';
import AdminPlacementTests from './pages/admin/AdminPlacementTests';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import CookieConsent from './components/common/CookieConsent';
import { usePageTracking } from './hooks/usePageTracking';
import './App.css';

const TrackingWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  usePageTracking();
  return <>{children}</>;
};

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <BrowserRouter>
          <TrackingWrapper>
            <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Home />} />
            <Route path="courses" element={<Courses />} />
            <Route path="course/:id" element={<CourseDetails />} />
            <Route
              path="payment"
              element={
                <ProtectedRoute allowedRoles={['STUDENT', 'ADMIN']}>
                  <Payment />
                </ProtectedRoute>
              }
            />
            <Route path="registrations" element={<EnrollmentList />} />
            <Route
              path="/my-learning"
              element={
                <ProtectedRoute allowedRoles={['STUDENT', 'TEACHER', 'ADMIN']}>
                  <MyLearning />
                </ProtectedRoute>
              }
            />
            <Route
              path="/bai-kiem-tra"
              element={
                <ProtectedRoute allowedRoles={['STUDENT', 'TEACHER', 'ADMIN']}>
                  <MyTests />
                </ProtectedRoute>
              }
            />
            <Route
              path="/lich-hoc"
              element={
                <ProtectedRoute>
                  <LearningSchedule />
                </ProtectedRoute>
              }
            />
            <Route
              path="/course/:id/lesson"
              element={
                <ProtectedRoute>
                  <LessonPlayer />
                </ProtectedRoute>
              }
            />
            <Route
              path="/course/:id/lesson/:lessonId"
              element={
                <ProtectedRoute>
                  <LessonPlayer />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/notifications"
              element={
                <ProtectedRoute>
                  <Notifications />
                </ProtectedRoute>
              }
            />
            <Route path="/forum" element={<Forum />} />
            <Route path="/forum/topic/:id" element={<TopicDetails />} />
            <Route path="/forum/new" element={<NewTopic />} />
            <Route
              path="/ai-chat"
              element={
                <ProtectedRoute allowedRoles={['STUDENT', 'TEACHER', 'ADMIN']}>
                  <AIChatPage />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<div className="p-10 text-center font-bold text-gray-400">Coming Soon...</div>} />
          </Route>

          <Route
            path="/quiz/:id"
            element={
              <ProtectedRoute allowedRoles={['STUDENT', 'TEACHER', 'ADMIN']}>
                <TakeQuiz />
              </ProtectedRoute>
            }
          />

          {/* Teacher Routes moved OUTSIDE MainLayout to have their own standalone Layout */}
          <Route
            path="/teacher"
            element={
              <ProtectedRoute allowedRoles={['TEACHER']}>
                <TeacherLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<TeacherDashboard />} />
            <Route path="dashboard" element={<TeacherDashboard />} />
            <Route path="statistics" element={<TeacherStatistics />} />
            <Route path="students" element={<StudentManagement />} />
            <Route path="quizzes" element={<QuizManagement />} />
            <Route path="courses" element={<TeacherCourses />} />
            <Route path="schedule" element={<TeacherSchedule />} />
            <Route path="create-course" element={<CourseEditor />} />
            <Route path="edit-course/:id" element={<CourseEditor />} />
            <Route path="content-editor/:id" element={<ContentEditor />} />
            <Route path="quiz-editor/:id" element={<QuizQuestionEditor />} />
            <Route path="quiz-attempts/:id" element={<QuizAttempts />} />
          </Route>

          {/* Admin Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="courses" element={<AdminCourses />} />
            <Route path="payments" element={<AdminPayments />} />
            <Route path="reviews" element={<AdminReviews />} />
            <Route path="categories" element={<AdminCategories />} />
            <Route path="reports" element={<ForumReports />} />
            <Route path="placement-tests" element={<AdminPlacementTests />} />
            <Route path="quiz-editor/:id" element={<QuizQuestionEditor />} />
            <Route path="ai-settings" element={<AdminAiSettings />} />
          </Route>
        </Routes>

        <Toaster 
          position="bottom-left" 
          reverseOrder={false}
          toastOptions={{
            duration: 5000,
            style: {
              background: '#fff',
              color: '#1e293b',
              padding: '16px 24px',
              borderRadius: '24px',
              fontSize: '14px',
              fontWeight: '600',
              boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
              border: '1px solid #f1f5f9',
              whiteSpace: 'pre-line',
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
          <CookieConsent />
        </TrackingWrapper>
      </BrowserRouter>
    </NotificationProvider>
  </AuthProvider>
);
}

export default App;
