import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { AuthProvider } from './contexts/AuthContext';
import Layout        from './components/Layout';
import PrivateRoute  from './components/PrivateRoute';
import Login         from './pages/Login';
import Dashboard     from './pages/Dashboard';
import StudentList   from './pages/students/StudentList';
import StudentDetail from './pages/students/StudentDetail';
import StudentForm   from './pages/students/StudentForm';
import PeriodForm    from './pages/students/PeriodForm';
import WorkoutForm   from './pages/students/WorkoutForm';
import WorkoutRun    from './pages/students/WorkoutRun';
import StudentHistory from './pages/students/StudentHistory';
import ExercisesList from './pages/ExercisesList';
import ExerciseForm  from './pages/ExerciseForm';

function AppRoutes() {
  const auth = useAuth();

  return (
    <AuthProvider auth={auth}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Login />} />
            <Route
              path="dashboard"
              element={
                <PrivateRoute token={auth.token} loading={auth.loading}>
                  <Dashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="exercises"
              element={
                <PrivateRoute token={auth.token} loading={auth.loading}>
                  <ExercisesList />
                </PrivateRoute>
              }
            />
            <Route
              path="exercises/new"
              element={
                <PrivateRoute token={auth.token} loading={auth.loading}>
                  <ExerciseForm />
                </PrivateRoute>
              }
            />
            <Route
              path="exercises/:id/edit"
              element={
                <PrivateRoute token={auth.token} loading={auth.loading}>
                  <ExerciseForm />
                </PrivateRoute>
              }
            />
            <Route
              path="students"
              element={
                <PrivateRoute token={auth.token} loading={auth.loading}>
                  <StudentList />
                </PrivateRoute>
              }
            />
            <Route
              path="students/new"
              element={
                <PrivateRoute token={auth.token} loading={auth.loading}>
                  <StudentForm />
                </PrivateRoute>
              }
            />
            <Route
              path="students/:id"
              element={
                <PrivateRoute token={auth.token} loading={auth.loading}>
                  <StudentDetail />
                </PrivateRoute>
              }
            />
            <Route
              path="students/:id/edit"
              element={
                <PrivateRoute token={auth.token} loading={auth.loading}>
                  <StudentForm />
                </PrivateRoute>
              }
            />
            <Route
              path="students/:id/periods/new"
              element={
                <PrivateRoute token={auth.token} loading={auth.loading}>
                  <PeriodForm />
                </PrivateRoute>
              }
            />
            <Route
              path="students/:id/periods/:periodId/edit"
              element={
                <PrivateRoute token={auth.token} loading={auth.loading}>
                  <PeriodForm />
                </PrivateRoute>
              }
            />
            <Route
              path="students/:id/workouts/new"
              element={
                <PrivateRoute token={auth.token} loading={auth.loading}>
                  <WorkoutForm />
                </PrivateRoute>
              }
            />
            <Route
              path="students/:id/workouts/:workoutId/edit"
              element={
                <PrivateRoute token={auth.token} loading={auth.loading}>
                  <WorkoutForm />
                </PrivateRoute>
              }
            />
            <Route
              path="students/:id/workouts/:workoutId/run"
              element={
                <PrivateRoute token={auth.token} loading={auth.loading}>
                  <WorkoutRun />
                </PrivateRoute>
              }
            />
            <Route
              path="students/:id/history"
              element={
                <PrivateRoute token={auth.token} loading={auth.loading}>
                  <StudentHistory />
                </PrivateRoute>
              }
            />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default AppRoutes;
