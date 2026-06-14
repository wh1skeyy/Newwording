import { createHashRouter } from 'react-router'
import LoginPage from './pages/LoginPage'
import StudentDashboard from './pages/StudentDashboard'
import LessonPage from './pages/LessonPage'
import PracticePage from './pages/PracticePage'
import TeacherDashboard from './pages/TeacherDashboard'

export const router = createHashRouter([
  {
    path: '/',
    Component: LoginPage,
  },
  {
    path: '/student/:studentId',
    Component: StudentDashboard,
  },
  {
    path: '/lesson/:lessonId',
    Component: LessonPage,
  },
  {
    path: '/practice/:studentId',
    Component: PracticePage,
  },
  {
    path: '/teacher',
    Component: TeacherDashboard,
  },
])
