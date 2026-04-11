const BASE = '/api';

async function request(method, path, body) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (body !== undefined) opts.body = JSON.stringify(body);

  const res  = await fetch(BASE + path, opts);
  if (res.status === 204) return null;
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Erro ${res.status}`);
  return data;
}

export const api = {
  // Alunos
  getStudents:   ()       => request('GET',    '/students'),
  getStudent:    (id)     => request('GET',    `/students/${id}`),
  createStudent: (data)   => request('POST',   '/students', data),
  updateStudent: (id, d)  => request('PUT',    `/students/${id}`, d),
  deleteStudent: (id)     => request('DELETE', `/students/${id}`),
  getStudentHistory: (id, params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request('GET', `/students/${id}/history${q ? `?${q}` : ''}`);
  },

  // Períodos
  getPeriods:    (sid)          => request('GET',    `/students/${sid}/periods`),
  createPeriod:  (sid, data)    => request('POST',   `/students/${sid}/periods`, data),
  updatePeriod:  (sid, id, d)   => request('PUT',    `/students/${sid}/periods/${id}`, d),
  deletePeriod:  (sid, id)      => request('DELETE', `/students/${sid}/periods/${id}`),

  // Treinos
  getWorkouts:   (sid)             => request('GET',    `/students/${sid}/workouts`),
  getWorkout:    (sid, wid)        => request('GET',    `/students/${sid}/workouts/${wid}`),
  createWorkout: (sid, data)       => request('POST',   `/students/${sid}/workouts`, data),
  updateWorkout: (sid, wid, data)  => request('PUT',    `/students/${sid}/workouts/${wid}`, data),
  deleteWorkout: (sid, wid)        => request('DELETE', `/students/${sid}/workouts/${wid}`),

  // Logs de execução
  getWorkoutLogs:  (sid, wid)            => request('GET',  `/students/${sid}/workouts/${wid}/logs`),
  saveWorkoutLogs: (sid, wid, entries)   => request('POST', `/students/${sid}/workouts/${wid}/logs`, { entries }),

  // Banco de mobilidade/alongamento
  getMobilityBank: (phase) => {
    const q = phase ? `?phase=${encodeURIComponent(phase)}` : '';
    return request('GET', `/mobility/bank${q}`);
  },
  getWorkoutMobility: (sid, wid)       => request('GET', `/students/${sid}/workouts/${wid}/mobility`),
  saveWorkoutMobility: (sid, wid, data) => request('PUT', `/students/${sid}/workouts/${wid}/mobility`, data),
};
