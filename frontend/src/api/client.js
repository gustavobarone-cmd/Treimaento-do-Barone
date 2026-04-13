const BASE = '/api';

async function request(method, path, body, token) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (token) opts.headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) opts.body = JSON.stringify(body);

  const res  = await fetch(BASE + path, opts);
  if (res.status === 204) return null;
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Erro ${res.status}`);
  return data;
}

export const api = {
  // Auth
  login: (email, password) => request('POST', '/auth/login', { email, password }),
  register: (email, password, role, studentId) => request('POST', '/auth/register', { email, password, role, studentId }),

  // Alunos
  getStudents: (token)   => request('GET',    '/students', undefined, token),
  getStudent:    (id, token)   => request('GET',    `/students/${id}`, undefined, token),
  createStudent: (data, token)   => request('POST',   '/students', data, token),
  updateStudent: (id, d, token)  => request('PUT',    `/students/${id}`, d, token),
  deleteStudent: (id, token)     => request('DELETE', `/students/${id}`, undefined, token),
  getStudentHistory: (id, params, token) => {
    const q = new URLSearchParams(params).toString();
    return request('GET', `/students/${id}/history${q ? `?${q}` : ''}`, undefined, token);
  },

  // Períodos
  getPeriods:    (sid, token)          => request('GET',    `/students/${sid}/periods`, undefined, token),
  createPeriod:  (sid, data, token)    => request('POST',   `/students/${sid}/periods`, data, token),
  updatePeriod:  (sid, id, d, token)   => request('PUT',    `/students/${sid}/periods/${id}`, d, token),
  deletePeriod:  (sid, id, token)      => request('DELETE', `/students/${sid}/periods/${id}`, undefined, token),

  // Treinos
  getWorkouts:   (sid, token)             => request('GET',    `/students/${sid}/workouts`, undefined, token),
  getWorkout:    (sid, wid, token)        => request('GET',    `/students/${sid}/workouts/${wid}`, undefined, token),
  createWorkout: (sid, data, token)       => request('POST',   `/students/${sid}/workouts`, data, token),
  updateWorkout: (sid, wid, data, token)  => request('PUT',    `/students/${sid}/workouts/${wid}`, data, token),
  deleteWorkout: (sid, wid, token)        => request('DELETE', `/students/${sid}/workouts/${wid}`, undefined, token),

  // Logs de execução
  getWorkoutLogs:  (sid, wid, token)            => request('GET',  `/students/${sid}/workouts/${wid}/logs`, undefined, token),
  saveWorkoutLogs: (sid, wid, entries, token)   => request('POST', `/students/${sid}/workouts/${wid}/logs`, { entries }, token),

  // Banco de mobilidade/alongamento
  getMobilityBank: (phase, token) => {
    const q = phase ? `?phase=${encodeURIComponent(phase)}` : '';
    return request('GET', `/mobility/bank${q}`, undefined, token);
  },
  getWorkoutMobility: (sid, wid, token)       => request('GET', `/students/${sid}/workouts/${wid}/mobility`, undefined, token),
  saveWorkoutMobility: (sid, wid, data, token) => request('PUT', `/students/${sid}/workouts/${wid}/mobility`, data, token),

  // Banco de exercícios
  getExercises: (token, filters = {}) => {
    const q = new URLSearchParams(filters).toString();
    return request('GET', `/exercises${q ? `?${q}` : ''}`, undefined, token);
  },
  getExercise: (id, token) => request('GET', `/exercises/${id}`, undefined, token),
  createExercise: (data, token) => request('POST', '/exercises', data, token),
  updateExercise: (id, data, token) => request('PUT', `/exercises/${id}`, data, token),
  deleteExercise: (id, token) => request('DELETE', `/exercises/${id}`, undefined, token),
};
