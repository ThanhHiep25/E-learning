import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import Home from './pages/Home';
import Courses from './pages/Courses';
import CourseDetails from './pages/CourseDetails';
import LessonPlayer from './pages/LessonPlayer';
import Payment from './pages/Payment';
import PaymentSuccess from './pages/PaymentSuccess';
import PaymentCancel from './pages/PaymentCancel';
import PaymentHistory from './pages/PaymentHistory';
import Profile from './pages/Profile';
import EnrollmentList from './pages/EnrollmentList';
// Old components (kept for reference/fallback)
import CourseDashboard from './pages/CourseDashboard';
import MyLearning from './pages/MyLearning';
import StudentDashboard from './pages/StudentDashboard';

// New Domain-based Components (Phase 1.1 Upgrade)
// import LearningHub from './pages/LearningHub';
// import CourseRoadmap from './domains/student/learning/CourseRoadmap';
import ResetPassword from './pages/ResetPassword';
import TakeQuiz from './pages/TakeQuiz';
import RenewEnrollment from './pages/RenewEnrollment';
import Notifications from './pages/Notifications';
import MyTests from './pages/MyTests';
import Forum from './pages/Forum';
import TopicDetails from './pages/TopicDetails';
import NewTopic from './pages/NewTopic';
import ForumReports from './pages/ForumReports';
import LearningSchedule from './pages/LearningSchedule';
import MyPath from './pages/MyPath';
import AIChatPage from './pages/student/AIChatPage';
import CertificateViewer from './pages/CertificateViewer';
import LevelCertificateViewer from './pages/LevelCertificateViewer';
import FinalQuizGate from './pages/FinalQuizGate';
import TeacherDashboard from './pages/teacher/Dashboard';
import StudentManagement from './pages/teacher/StudentManagement';
import QuizManagement from './pages/teacher/QuizManagement';
import FinalQuizManager from './pages/teacher/FinalQuizManager';
import QuizQuestionEditor from './pages/teacher/QuizQuestionEditor';
import QuizAttempts from './pages/teacher/QuizAttempts';
import TeacherStatistics from './pages/teacher/Statistics';
import TeacherLayout from './components/layout/TeacherLayout';
import AdminLayout from './components/layout/AdminLayout';
import CourseEditor from './pages/teacher/CourseEditor';
import ContentEditor from './pages/teacher/ContentEditor';
import TeacherCourses from './pages/teacher/TeacherCourses';
import TeacherSchedule from './pages/teacher/TeacherSchedule';
import ChatList from './pages/teacher/ChatList';
import ChatManagement from './pages/teacher/ChatManagement';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminStudents from './pages/admin/AdminStudents';
import AdminTeachers from './pages/admin/AdminTeachers';
import AdminCourses from './pages/admin/AdminCourses';
import AdminAuditLogs from './pages/admin/AdminAuditLogs';
import AdminPayments from './pages/admin/AdminPayments';
import AdminReviews from './pages/admin/AdminReviews';
import AdminCategories from './pages/admin/AdminCategories';
import AdminPlacementTests from './pages/admin/AdminPlacementTests';
import AdminNotifications from './pages/admin/AdminNotifications';
import AdminChatList from './pages/admin/AdminChatList';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import CookieConsent from './components/common/CookieConsent';
import { usePageTracking } from './hooks/usePageTracking';
import { useNotificationDeepLink } from './hooks/useNotificationDeepLink';
import Login from './pages/Login';
import './App.css';

const TrackingWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  usePageTracking();
  return <>{children}</>;
};

const NotificationDeepLinkWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useNotificationDeepLink();
  return <>{children}</>;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <NotificationProvider>
          <TrackingWrapper>
            <NotificationDeepLinkWrapper>
            <Routes>
          <Route path="/payment/success" element={<PaymentSuccess />} />
          <Route path="/payment/cancel" element={<PaymentCancel />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Home />} />
            <Route path="courses" element={<Courses />} />
            <Route path="courses/:category" element={<Courses />} />
            <Route path="course/:id" element={<CourseDetails />} />
            <Route
              path="payment"
              element={
                <ProtectedRoute allowedRoles={['STUDENT', 'ADMIN']}>
                  <Payment />
                </ProtectedRoute>
              }
            />
            <Route
              path="payment-history"
              element={
                <ProtectedRoute allowedRoles={['STUDENT', 'ADMIN']}>
                  <PaymentHistory />
                </ProtectedRoute>
              }
            />
            <Route path="registrations" element={<EnrollmentList />} />
            {/* Phase 1.1: Upgraded Learning Flow */}
            <Route
              path="/my-learning"
              element={
                <ProtectedRoute allowedRoles={['STUDENT']}>
                  <MyLearning />
                </ProtectedRoute>
              }
            />
            <Route
              path="/my-path"
              element={
                <ProtectedRoute allowedRoles={['STUDENT']}>
                  <MyPath />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student-dashboard"
              element={
                <ProtectedRoute allowedRoles={['STUDENT']}>
                  <StudentDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/course/:id/dashboard"
              element={
                <ProtectedRoute allowedRoles={['STUDENT']}>
                  <CourseDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/course/:id/renew"
              element={
                <ProtectedRoute allowedRoles={['STUDENT']}>
                  <RenewEnrollment />
                </ProtectedRoute>
              }
            />
            <Route
              path="/course/:id/lesson"
              element={<LessonPlayer />}
            />
            <Route
              path="/course/:id/lesson/:lessonId"
              element={<LessonPlayer />}
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
            <Route path="forum" element={<Forum />} />
            <Route
              path="lich-hoc"
              element={
                <ProtectedRoute allowedRoles={['STUDENT', 'TEACHER', 'ADMIN']}>
                  <LearningSchedule />
                </ProtectedRoute>
              }
            />
            <Route path="forum/topic/:id" element={<TopicDetails />} />
            <Route path="/forum/new" element={<NewTopic />} />
            <Route
              path="/ai-chat"
              element={
                <ProtectedRoute allowedRoles={['STUDENT', 'TEACHER', 'ADMIN']}>
                  <AIChatPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/my-tests"
              element={
                <ProtectedRoute allowedRoles={['STUDENT']}>
                  <MyTests />
                </ProtectedRoute>
              }
            />
            <Route path="/verify/:certId" element={<CertificateViewer />} />
            <Route path="/verify-level/:certId" element={<LevelCertificateViewer />} />
            <Route path="/final-quiz/:level" element={
              <ProtectedRoute allowedRoles={['STUDENT', 'ADMIN']}>
                <FinalQuizGate />
              </ProtectedRoute>
            } />
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
          <Route
            path="/take-quiz/:id"
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
            <Route path="final-quizzes" element={<FinalQuizManager />} />
            <Route path="courses" element={<TeacherCourses />} />
            <Route path="schedule" element={<TeacherSchedule />} />
            <Route path="create-course" element={<CourseEditor />} />
            <Route path="edit-course/:id" element={<CourseEditor />} />
            <Route path="content-editor/:id" element={<ContentEditor />} />
            <Route path="quiz-editor/:id" element={<QuizQuestionEditor />} />
            <Route path="quiz-attempts/:id" element={<QuizAttempts />} />
            <Route path="chats" element={<ChatList />} />
            <Route path="chat/:courseId" element={<ChatManagement type="course" />} />
            <Route path="lecture-chat/:lessonId" element={<ChatManagement type="lecture" />} />
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
            <Route path="students" element={<AdminStudents />} />
            <Route path="teachers" element={<AdminTeachers />} />
            <Route path="courses" element={<AdminCourses />} />
            <Route path="payments" element={<AdminPayments />} />
            <Route path="reviews" element={<AdminReviews />} />
            <Route path="categories" element={<AdminCategories />} />
            <Route path="audit-logs" element={<AdminAuditLogs />} />
            <Route path="reports" element={<ForumReports />} />
            <Route path="placement-tests" element={<AdminPlacementTests />} />
            <Route path="final-quizzes" element={<FinalQuizManager />} />
            <Route path="quiz-editor/:id" element={<QuizQuestionEditor />} />
            <Route path="notifications" element={<AdminNotifications />} />
            <Route path="chats" element={<AdminChatList />} />
            <Route path="chat/:courseId" element={<ChatManagement type="course" />} />
            <Route path="lecture-chat/:lessonId" element={<ChatManagement type="lecture" />} />
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
            </NotificationDeepLinkWrapper>
        </TrackingWrapper>
      </NotificationProvider>
      </BrowserRouter>
    </AuthProvider>
);
}

export default App;
