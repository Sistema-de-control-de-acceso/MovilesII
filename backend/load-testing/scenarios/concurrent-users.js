/**
 * Escenario: Usuarios Concurrentes
 * 
 * Simula 500 usuarios simultáneos realizando operaciones variadas
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { BASE_URL, TEST_USERS, TEST_ALUMNOS } from '../k6.config.js';

export const options = {
  stages: [
    { duration: '2m', target: 100 },   // Ramp up a 100
    { duration: '3m', target: 300 },    // Ramp up a 300
    { duration: '5m', target: 500 },  // Ramp up a 500 (objetivo)
    { duration: '10m', target: 500 },  // Mantener 500 por 10 min
    { duration: '2m', target: 300 },   // Ramp down
    { duration: '1m', target: 0 },    // Finalizar
  ],
  thresholds: {
    http_req_duration: ['p(50)<200', 'p(95)<500', 'p(99)<1000'],
    http_req_failed: ['rate<0.005'],
    checks: ['rate>0.995'],
  },
  tags: {
    scenario: 'concurrent-users',
    test_type: 'load',
  },
};

export default function () {
  const user = TEST_USERS[Math.floor(Math.random() * TEST_USERS.length)];
  
  // Login
  const loginRes = http.post(`${BASE_URL}/login`, JSON.stringify({
    email: user.email,
    password: user.password,
  }), {
    headers: { 'Content-Type': 'application/json' },
    tags: { name: 'Login' },
  });

  check(loginRes, {
    'login successful': (r) => r.status === 200,
  });

  if (loginRes.status !== 200) {
    return;
  }

  let token = null;
  try {
    const loginBody = JSON.parse(loginRes.body);
    token = loginBody.token || loginBody.user?.token;
  } catch (e) {}

  const headers = {
    'Content-Type': 'application/json',
    'X-Client-Type': 'mobile',
    'X-Device-ID': `device-${__VU}-${__ITER}`,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Operaciones variadas según iteración
  const operation = __ITER % 4;

  switch (operation) {
    case 0:
      // Consultar lista de alumnos
      const alumnosRes = http.get(`${BASE_URL}/alumnos`, {
        headers,
        tags: { name: 'ListAlumnos' },
      });
      check(alumnosRes, {
        'list alumnos status 200': (r) => r.status === 200,
        'list alumnos response time < 300ms': (r) => r.timings.duration < 300,
      });
      break;

    case 1:
      // Consultar alumno específico
      const codigo = TEST_ALUMNOS[Math.floor(Math.random() * TEST_ALUMNOS.length)];
      const alumnoRes = http.get(`${BASE_URL}/alumnos/${codigo}`, {
        headers,
        tags: { name: 'GetAlumno' },
      });
      check(alumnoRes, {
        'get alumno status 200': (r) => r.status === 200 || r.status === 404,
      });
      break;

    case 2:
      // Consultar asistencias
      const asistenciasRes = http.get(`${BASE_URL}/asistencias?limit=10`, {
        headers,
        tags: { name: 'ListAsistencias' },
      });
      check(asistenciasRes, {
        'list asistencias status 200': (r) => r.status === 200,
      });
      break;

    case 3:
      // Registrar asistencia
      const asistenciaData = {
        codigo_alumno: TEST_ALUMNOS[Math.floor(Math.random() * TEST_ALUMNOS.length)],
        tipo: Math.random() > 0.5 ? 'entrada' : 'salida',
        fecha: new Date().toISOString(),
        punto_control: 'P001',
        metodo: 'nfc',
      };
      const asistenciaRes = http.post(
        `${BASE_URL}/asistencias/completa`,
        JSON.stringify(asistenciaData),
        {
          headers,
          tags: { name: 'RegistrarAsistencia' },
        }
      );
      check(asistenciaRes, {
        'asistencia status 201': (r) => r.status === 201 || r.status === 200,
        'asistencia response time < 200ms': (r) => r.timings.duration < 200,
      });
      break;
  }

  sleep(Math.random() * 2 + 0.5); // Sleep aleatorio entre 0.5-2.5s
}

