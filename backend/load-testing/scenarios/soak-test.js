/**
 * Escenario: Soak Test (Prueba de Resistencia)
 * 
 * Ejecuta carga moderada durante 24 horas para detectar
 * memory leaks, degradación de performance, etc.
 * 
 * NOTA: Para ejecutar 24h, usar:
 * k6 run --duration 24h soak-test.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { BASE_URL, TEST_USERS, TEST_ALUMNOS } from '../k6.config.js';

export const options = {
  stages: [
    { duration: '5m', target: 50 },    // Ramp up inicial
    { duration: '23h50m', target: 50 }, // Mantener 50 usuarios por ~24h
    { duration: '5m', target: 0 },     // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(50)<200', 'p(95)<500', 'p(99)<1000'],
    http_req_failed: ['rate<0.005'],
    checks: ['rate>0.99'],
    // Detectar memory leaks: el tiempo de respuesta no debe degradarse
    'http_req_duration{name:RegistrarAsistencia}': [
      'p(95)<500', // P95 debe mantenerse bajo durante toda la prueba
    ],
  },
  tags: {
    scenario: 'soak-test',
    test_type: 'soak',
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

  // Operaciones variadas para simular uso real
  const operation = __ITER % 5;

  switch (operation) {
    case 0:
      // Health check
      const healthRes = http.get(`${BASE_URL}/health/detailed`, {
        headers,
        tags: { name: 'HealthCheck' },
      });
      check(healthRes, {
        'health status 200': (r) => r.status === 200,
      });
      break;

    case 1:
      // Consultar alumno
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
      // Registrar asistencia (operación crítica)
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

    case 3:
      // Consultar asistencias
      const asistenciasRes = http.get(`${BASE_URL}/asistencias?limit=20`, {
        headers,
        tags: { name: 'ListAsistencias' },
      });
      check(asistenciasRes, {
        'list asistencias status 200': (r) => r.status === 200,
      });
      break;

    case 4:
      // Dashboard metrics
      const metricsRes = http.get(`${BASE_URL}/dashboard/metrics`, {
        headers,
        tags: { name: 'DashboardMetrics' },
      });
      check(metricsRes, {
        'metrics status 200': (r) => r.status === 200,
      });
      break;
  }

  sleep(Math.random() * 3 + 1); // Sleep aleatorio entre 1-4s (simula uso real)
}

