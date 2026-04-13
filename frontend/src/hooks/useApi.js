import { useAuthContext } from '../contexts/AuthContext';

export function useApi() {
  const { token } = useAuthContext();

  return {
    login: (email, password) => authApi.login(email, password),
    register: (email, password, role, studentId) => authApi.register(email, password, role, studentId),
    getStudents: () => require('../api/client').api.getStudents(token),
    getStudent: (id) => require('../api/client').api.getStudent(id, token),
    createStudent: (data) => require('../api/client').api.createStudent(data, token),
    updateStudent: (id, d) => require('../api/client').api.updateStudent(id, d, token),
    deleteStudent: (id) => require('../api/client').api.deleteStudent(id, token),
    getStudentHistory: (id, params) => require('../api/client').api.getStudentHistory(id, params, token),
    getPeriods: (sid) => require('../api/client').api.getPeriods(sid, token),
    createPeriod: (sid, data) => require('../api/client').api.createPeriod(sid, data, token),
    updatePeriod: (sid, id, d) => require('../api/client').api.updatePeriod(sid, id, d, token),
    deletePeriod: (sid, id) => require('../api/client').api.deletePeriod(sid, id, token),
    getWorkouts: (sid) => require('../api/client').api.getWorkouts(sid, token),
    getWorkout: (sid, wid) => require('../api/client').api.getWorkout(sid, wid, token),
    createWorkout: (sid, data) => require('../api/client').api.createWorkout(sid, data, token),
    updateWorkout: (sid, wid, data) => require('../api/client').api.updateWorkout(sid, wid, data, token),
    deleteWorkout: (sid, wid) => require('../api/client').api.deleteWorkout(sid, wid, token),
    getWorkoutLogs: (sid, wid) => require('../api/client').api.getWorkoutLogs(sid, wid, token),
    saveWorkoutLogs: (sid, wid, entries) => require('../api/client').api.saveWorkoutLogs(sid, wid, entries, token),
    getMobilityBank: (phase) => require('../api/client').api.getMobilityBank(phase, token),
    getWorkoutMobility: (sid, wid) => require('../api/client').api.getWorkoutMobility(sid, wid, token),
    saveWorkoutMobility: (sid, wid, data) => require('../api/client').api.saveWorkoutMobility(sid, wid, data, token),
    getExercises: (filters) => require('../api/client').api.getExercises(token, filters),
    getExercise: (id) => require('../api/client').api.getExercise(id, token),
    createExercise: (data) => require('../api/client').api.createExercise(data, token),
    updateExercise: (id, data) => require('../api/client').api.updateExercise(id, data, token),
    deleteExercise: (id) => require('../api/client').api.deleteExercise(id, token),
  };
}

// Auth endpoints don't require token
const authApi = {
  login: (email, password) => require('../api/client').api.login(email, password),
  register: (email, password, role, studentId) => require('../api/client').api.register(email, password, role, studentId),
};
