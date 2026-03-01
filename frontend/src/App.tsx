import { Suspense, lazy } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { AuthProvider } from '@/context/AuthContext'
import { ToastProvider } from '@/context/ToastContext'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import ProtectedRoute from '@/components/ProtectedRoute'

// Pages
import Home from '@/pages/Home'
import Courses from '@/pages/Courses'
const CourseDetail = lazy(() => import('@/pages/CourseDetail'))
const CourseLearn = lazy(() => import('@/pages/CourseLearn'))
const MyCourses = lazy(() => import('@/pages/MyCourses'))
const Profile = lazy(() => import('@/pages/Profile'))
import NotFound from '@/pages/NotFound'
import Auth from '@/pages/Auth'
const Certificates = lazy(() => import('@/pages/Certificates'))
const Assignments = lazy(() => import('@/pages/Assignments'))

// Admin Pages
const AdminDashboard = lazy(() => import('@/pages/admin/AdminDashboard'))
const AdminCourses = lazy(() => import('@/pages/admin/AdminCourses'))
const AdminUsers = lazy(() => import('@/pages/admin/AdminUsers'))
const AdminOrders = lazy(() => import('@/pages/admin/AdminOrders'))
const AdminLogs = lazy(() => import('@/pages/admin/AdminLogs'))
const AdminSettings = lazy(() => import('@/pages/admin/AdminSettings'))
const AdminAnalytics = lazy(() => import('@/pages/admin/AdminAnalytics'))
const CreateCourse = lazy(() => import('@/pages/instructor/CreateCourse'))
const EditCourse = lazy(() => import('@/pages/instructor/EditCourse'))
const ManageLessons = lazy(() => import('@/pages/instructor/ManageLessons'))

// Student Pages
const StudentDashboard = lazy(() => import('@/pages/student/StudentDashboard'))

const InstitutionalLoader = () => (
    <div className="flex h-screen items-center justify-center bg-background-light dark:bg-background-dark">
        <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
            <p className="text-slate-500 font-medium animate-pulse uppercase tracking-widest text-xs">Initializing Secure Environment...</p>
        </div>
    </div>
);

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

function App() {
    return (
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
            <AuthProvider>
                <ToastProvider>
                    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                        <div className="antialiased min-h-screen flex flex-col w-full bg-background-light dark:bg-background-dark">
                            <Suspense fallback={<InstitutionalLoader />}>
                                <Routes>
                                    {/* Dashboard & Student Routes - No Global Navbar/Footer */}
                                    <Route path="/admin/*" element={
                                        <ProtectedRoute role="admin">
                                            <AdminRoutes />
                                        </ProtectedRoute>
                                    } />
                                    <Route path="/student/dashboard" element={
                                        <ProtectedRoute role="student">
                                            <StudentDashboard />
                                        </ProtectedRoute>
                                    } />
                                    <Route path="/my-courses" element={
                                        <ProtectedRoute role="student">
                                            <MyCourses />
                                        </ProtectedRoute>
                                    } />
                                    <Route path="/courses" element={<Courses />} />
                                    <Route path="/courses/:id/learn" element={
                                        <ProtectedRoute role="student">
                                            <CourseLearn />
                                        </ProtectedRoute>
                                    } />
                                    <Route path="/certificates" element={
                                        <ProtectedRoute role="student">
                                            <Certificates />
                                        </ProtectedRoute>
                                    } />
                                    <Route path="/assignments" element={
                                        <ProtectedRoute role="student">
                                            <Assignments />
                                        </ProtectedRoute>
                                    } />
                                    <Route path="/profile" element={
                                        <ProtectedRoute>
                                            <Profile />
                                        </ProtectedRoute>
                                    } />

                                    {/* Public Routes - With Global Navbar/Footer */}
                                    <Route path="*" element={
                                        <>
                                            <Navbar />
                                            <main className="flex-1 w-full">
                                                <Routes>
                                                    <Route path="/" element={<Home />} />
                                                    <Route path="/auth" element={<Auth />} />
                                                    <Route path="/courses/:id" element={<CourseDetail />} />
                                                    <Route path="*" element={<NotFound />} />
                                                </Routes>
                                            </main>
                                            <Footer />
                                        </>
                                    } />
                                </Routes>
                            </Suspense>
                        </div>
                    </Router>
                </ToastProvider>
            </AuthProvider>
        </GoogleOAuthProvider>
    )
}

function AdminRoutes() {
    return (
        <Routes>
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="courses" element={<AdminCourses />} />
            <Route path="courses/create" element={<CreateCourse />} />
            <Route path="courses/:id/edit" element={<EditCourse />} />
            <Route path="courses/:id/lessons" element={<ManageLessons />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="analytics" element={<AdminAnalytics />} />
            <Route path="settings" element={<AdminSettings />} />
            <Route path="logs" element={<AdminLogs />} />
        </Routes>
    )
}

export default App
