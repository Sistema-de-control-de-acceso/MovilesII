/**
 * Escenario: Horario Pico de Entrada/Salida
 * 
 * Simula carga durante horarios pico (7-9 AM, 3-5 PM)
 * con múltiples usuarios realizando check-in simultáneos
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { BASE_URL, TEST_USERS, TEST_ALUMNOS } from '../k6.config.js';

export const options = {
  stages: [
    { duration: '1m', target: 50 },   // Ramp up rápido
    { duration: '5m', target: 200 },   // Carga pico
    { duration: '3m', target: 200 },  // Mantener pico
    { duration: '2m', target: 100 },   // Reducir gradualmente
    { duration: '1m', target: 0 },    // Finalizar
  ],
  thresholds: {
    http_req_duration: ['p(50)<200', 'p(95)<500', 'p(99)<1000'],
    http_req_failed: ['rate<0.005'],
    checks: ['rate>0.99'],
  },
  tags: {
    scenario: 'peak-hours',
    test_type: 'load',
  },
};

export default function () {
  // Seleccionar usuario aleatorio
  const user = TEST_USERS[Math.floor(Math.random() * TEST_USERS.length)];
  
  // 1. Login
  const loginRes = http.post(`${BASE_URL}/login`, JSON.stringify({
    email: user.email,
    password: user.password,
  }), {
    headers: { 'Content-Type': 'application/json' },
    tags: { name: 'Login' },
  });

  check(loginRes, {
    'login status 200': (r) => r.status === 200,
    'login response time < 500ms': (r) => r.timings.duration < 500,
    'login has token': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.token || body.user;
      } catch {
        return false;
      }
    },
  });

  if (loginRes.status !== 200) {
    return;
  }

  let token = null;
  try {
    const loginBody = JSON.parse(loginRes.body);
    token = loginBody.token || loginBody.user?.token;
  } catch (e) {
    // Si no hay token, usar header de autorización si existe
    token = loginRes.headers['Authorization'];
  }

  const headers = {
    'Content-Type': 'application/json',
    'X-Client-Type': 'mobile',
    'X-Device-ID': `device-${__VU}-${__ITER}`,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // 2. Consultar alumno (simula búsqueda antes de check-in)
  const codigoAlumno = TEST_ALUMNOS[Math.floor(Math.random() * TEST_ALUMNOS.length)];
  const alumnoRes = http.get(`${BASE_URL}/alumnos/${codigoAlumno}`, {
    headers,
    tags: { name: 'GetAlumno' },
  });

  check(alumnoRes, {
    'get alumno status 200': (r) => r.status === 200 || r.status === 404,
    'get alumno response time < 300ms': (r) => r.timings.duration < 300,
  });

  sleep(0.5); // Simular tiempo de lectura/escaneo

  // 3. Registrar asistencia (check-in)
  const asistenciaData = {
    codigo_alumno: codigoAlumno,
    tipo: Math.random() > 0.5 ? 'entrada' : 'salida',
    fecha: new Date().toISOString(),
    punto_control: 'P001',
    metodo: 'nfc',
    latitud: -12.0464 + (Math.random() * 0.01),
    longitud: -77.0428 + (Math.random() * 0.01),
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
    'asistencia has id': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body._id || body.id;
      } catch {
        return false;
      }
    },
  });

  sleep(1); // Simular tiempo entre operaciones
}

