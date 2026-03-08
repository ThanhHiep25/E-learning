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
import TeacherDashboard from './pages/teacher/Dashboard';
import StudentManagement from './pages/teacher/StudentManagement';
import QuizManagement from './pages/teacher/QuizManagement';
import QuizQuestionEditor from './pages/teacher/QuizQuestionEditor';
import TeacherStatistics from './pages/teacher/Statistics';
import TeacherLayout from './components/layout/TeacherLayout';
import AdminLayout from './components/layout/AdminLayout';
import CourseEditor from './pages/teacher/CourseEditor';
import ContentEditor from './pages/teacher/ContentEditor';
import TeacherCourses from './pages/teacher/TeacherCourses';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminCourses from './pages/admin/AdminCourses';
import AdminPayments from './pages/admin/AdminPayments';
import AdminReviews from './pages/admin/AdminReviews';
import AdminCategories from './pages/admin/AdminCategories';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
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
            <Route path="*" element={<div className="p-10 text-center font-bold text-gray-500">Coming Soon...</div>} />
          </Route>

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
            <Route path="create-course" element={<CourseEditor />} />
            <Route path="edit-course/:id" element={<CourseEditor />} />
            <Route path="content-editor/:id" element={<ContentEditor />} />
            <Route path="quiz-editor/:id" element={<QuizQuestionEditor />} />
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
          </Route>
        </Routes>

        <Toaster position="bottom-left" reverseOrder={false} />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
