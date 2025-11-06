/**
 * Escenario: Stress Test
 * 
 * Identifica el punto de quiebre del sistema
 * Incrementa carga hasta que el sistema falle
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { BASE_URL, TEST_USERS, TEST_ALUMNOS } from '../k6.config.js';

export const options = {
  stages: [
    { duration: '1m', target: 100 },   // Inicio
    { duration: '2m', target: 200 },   // +100
    { duration: '2m', target: 300 },   // +100
    { duration: '2m', target: 400 },   // +100
    { duration: '2m', target: 500 },   // +100
    { duration: '2m', target: 600 },   // +100
    { duration: '2m', target: 700 },   // +100
    { duration: '2m', target: 800 },   // +100
    { duration: '2m', target: 900 },   // +100
    { duration: '2m', target: 1000 },  // +100 (punto de quiebre esperado)
    { duration: '2m', target: 0 },     // Finalizar
  ],
  thresholds: {
    // Thresholds más permisivos para stress test
    http_req_duration: ['p(95)<2000', 'p(99)<5000'],
    http_req_failed: ['rate<0.1'], // Permitir hasta 10% de errores
  },
  tags: {
    scenario: 'stress-test',
    test_type: 'stress',
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
    'login status 200': (r) => r.status === 200,
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

  // Operación más común: registrar asistencia
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
    'asistencia status 201 or 200': (r) => r.status === 201 || r.status === 200,
    'asistencia response time < 5000ms': (r) => r.timings.duration < 5000,
  });

  sleep(0.1); // Sleep mínimo para maximizar carga
}

