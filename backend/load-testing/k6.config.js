/**
 * Configuración base para pruebas de carga con K6
 */

export const options = {
  // Configuración de thresholds (objetivos de performance)
  thresholds: {
    // Tiempo de respuesta promedio < 200ms para operaciones críticas
    http_req_duration: ['p(50)<200', 'p(95)<500', 'p(99)<1000'],
    // Tasa de éxito > 99.5%
    http_req_failed: ['rate<0.005'],
    // Sin errores de conexión
    http_req_connecting: ['p(95)<100'],
    // Checks deben pasar
    checks: ['rate>0.995']
  },
  
  // Configuración de escenarios
  scenarios: {
    // Escenario por defecto - carga incremental
    load_test: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 100 },   // Ramp up a 100 usuarios en 2 min
        { duration: '5m', target: 500 },   // Ramp up a 500 usuarios en 5 min
        { duration: '10m', target: 500 },  // Mantener 500 usuarios por 10 min
        { duration: '2m', target: 0 },      // Ramp down a 0 en 2 min
      ],
      gracefulRampDown: '30s',
    },
  },
  
  // Configuración de tags
  tags: {
    environment: 'staging',
    test_type: 'load',
  },
};

// URL base del servidor
export const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

// Usuarios de prueba
export const TEST_USERS = [
  { email: 'admin@test.com', password: 'admin123' },
  { email: 'guard@test.com', password: 'guard123' },
  { email: 'user1@test.com', password: 'user123' },
  { email: 'user2@test.com', password: 'user123' },
  { email: 'user3@test.com', password: 'user123' },
];

// Códigos de alumnos de prueba
export const TEST_ALUMNOS = [
  'A001', 'A002', 'A003', 'A004', 'A005',
  'A006', 'A007', 'A008', 'A009', 'A010',
];

