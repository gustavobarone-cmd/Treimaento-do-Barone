import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout        from './components/Layout';
import Login         from './pages/Login';
import StudentList   from './pages/students/StudentList';
import StudentDetail from './pages/students/StudentDetail';
import StudentForm   from './pages/students/StudentForm';
import PeriodForm    from './pages/students/PeriodForm';
import WorkoutForm   from './pages/students/WorkoutForm';
import WorkoutRun    from './pages/students/WorkoutRun';
import StudentHistory from './pages/students/StudentHistory';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Login />} />
          <Route path="students"                                   element={<StudentList />}   />
          <Route path="students/new"                               element={<StudentForm />}   />
          <Route path="students/:id"                               element={<StudentDetail />} />
          <Route path="students/:id/edit"                          element={<StudentForm />}   />
          <Route path="students/:id/periods/new"                   element={<PeriodForm />}    />
          <Route path="students/:id/periods/:periodId/edit"        element={<PeriodForm />}    />
          <Route path="students/:id/workouts/new"                  element={<WorkoutForm />}   />
          <Route path="students/:id/workouts/:workoutId/edit"      element={<WorkoutForm />}   />
          <Route path="students/:id/workouts/:workoutId/run"       element={<WorkoutRun />}    />
          <Route path="students/:id/history"                        element={<StudentHistory />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
