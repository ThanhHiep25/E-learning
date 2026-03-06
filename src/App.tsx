import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import Home from './pages/Home';
import Courses from './pages/Courses';
import CourseDetails from './pages/CourseDetails';
import LessonPlayer from './pages/LessonPlayer';
import Profile from './pages/Profile';
import LearningSchedule from './pages/LearningSchedule';
import EnrollmentList from './pages/EnrollmentList';
import MyLearning from './pages/MyLearning';
import MyTests from './pages/MyTests';
import TeacherDashboard from './pages/teacher/Dashboard';
import StudentManagement from './pages/teacher/StudentManagement';
import QuizManagement from './pages/teacher/QuizManagement';
import TeacherStatistics from './pages/teacher/Statistics';
import TeacherLayout from './components/layout/TeacherLayout';
import CourseEditor from './pages/teacher/CourseEditor';
import ContentEditor from './pages/teacher/ContentEditor';
import ProtectedRoute from './components/auth/ProtectedRoute';
import ResetPassword from './pages/ResetPassword';
import CategoryManagement from './pages/admin/CategoryManagement';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Home />} />
            <Route path="courses" element={<Courses />} />
            <Route path="course/:id" element={<CourseDetails />} />
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
              <ProtectedRoute allowedRoles={['TEACHER', 'ADMIN']}>
                <TeacherLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<TeacherStatistics />} />
            <Route path="dashboard" element={<TeacherDashboard />} />
            <Route path="statistics" element={<TeacherStatistics />} />
            <Route path="students" element={<StudentManagement />} />
            <Route path="quizzes" element={<QuizManagement />} />
            <Route path="courses" element={<TeacherDashboard />} />
            <Route path="create-course" element={<CourseEditor />} />
            <Route path="edit-course/:id" element={<CourseEditor />} />
            <Route path="content-editor/:id" element={<ContentEditor />} />
          </Route>

          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <TeacherLayout />
              </ProtectedRoute>
            }
          >
            <Route path="categories" element={<CategoryManagement />} />
          </Route>

          <Route path="/reset-password" element={<ResetPassword />} />
        </Routes>

        <Toaster position="bottom-left" reverseOrder={false} />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
