const { validateMovimiento } = require('../../utils/validaciones');
const { mockAsistencia, mockPresencia } = require('../utils/mocks');
const Presencia = require('../../models/Presencia');
const Asistencia = require('../../models/Asistencia');

describe('Validación de Movimientos', () => {
  beforeEach(async () => {
    // Limpiar antes de cada test
    await Presencia.deleteMany({});
    await Asistencia.deleteMany({});
  });

  describe('Validar entrada', () => {
    it('debe permitir entrada cuando el estudiante no está dentro', async () => {
      const resultado = await validateMovimiento({
        dni: '12345678',
        tipo: 'entrada',
        fecha_hora: new Date(),
        Asistencia,
        Presencia,
      });

      expect(resultado.es_valido).toBe(true);
      expect(resultado.tipo_sugerido).toBe('entrada');
    });

    it('debe rechazar entrada cuando el estudiante ya está dentro', async () => {
      const presenciaActiva = mockPresencia({ esta_dentro: true });
      await Presencia.create(presenciaActiva);

      const resultado = await validateMovimiento({
        dni: presenciaActiva.estudiante_dni,
        tipo: 'entrada',
        fecha_hora: new Date(),
        Asistencia,
        Presencia,
      });

      expect(resultado.es_valido).toBe(false);
      expect(resultado.tipo_sugerido).toBe('salida');
      expect(resultado.requiere_autorizacion_manual).toBe(true);
    });
  });

  describe('Validar salida', () => {
    it('debe permitir salida cuando el estudiante está dentro', async () => {
      const presenciaActiva = mockPresencia({ esta_dentro: true });
      await Presencia.create(presenciaActiva);

      const resultado = await validateMovimiento({
        dni: presenciaActiva.estudiante_dni,
        tipo: 'salida',
        fecha_hora: new Date(),
        Asistencia,
        Presencia,
      });

      expect(resultado.es_valido).toBe(true);
      expect(resultado.tipo_sugerido).toBe('salida');
    });

    it('debe rechazar salida cuando el estudiante no está dentro', async () => {
      const resultado = await validateMovimiento({
        dni: '12345678',
        tipo: 'salida',
        fecha_hora: new Date(),
        Asistencia,
        Presencia,
      });

      expect(resultado.es_valido).toBe(false);
      expect(resultado.tipo_sugerido).toBe('entrada');
      expect(resultado.requiere_autorizacion_manual).toBe(true);
    });
  });

  describe('Validación de coherencia temporal', () => {
    it('debe rechazar movimiento con fecha anterior al último registro', async () => {
      const fechaAnterior = new Date('2024-01-01');
      const fechaPosterior = new Date('2024-01-02');
      const ultimaAsistencia = mockAsistencia({
        fecha_hora: fechaPosterior,
        tipo: 'entrada',
        dni: '12345678',
      });

      await Asistencia.create(ultimaAsistencia);

      const resultado = await validateMovimiento({
        dni: '12345678',
        tipo: 'salida',
        fecha_hora: fechaAnterior,
        Asistencia,
        Presencia,
      });

      expect(resultado.es_valido).toBe(false);
      expect(resultado.motivo).toContain('anterior');
    });

    it('debe rechazar dos movimientos del mismo tipo consecutivos', async () => {
      const ultimaAsistencia = mockAsistencia({
        fecha_hora: new Date('2024-01-01'),
        tipo: 'entrada',
        dni: '12345678',
      });

      await Asistencia.create(ultimaAsistencia);

      const resultado = await validateMovimiento({
        dni: '12345678',
        tipo: 'entrada',
        fecha_hora: new Date('2024-01-02'),
        Asistencia,
        Presencia,
      });

      expect(resultado.es_valido).toBe(false);
      expect(resultado.tipo_sugerido).toBe('salida');
    });

    it('debe rechazar movimientos muy rápidos (menos de 30 segundos)', async () => {
      const fechaAnterior = new Date('2024-01-01T10:00:00');
      const fechaRapida = new Date('2024-01-01T10:00:15'); // 15 segundos después
      const ultimaAsistencia = mockAsistencia({
        fecha_hora: fechaAnterior,
        tipo: 'entrada',
        dni: '12345678',
      });

      await Asistencia.create(ultimaAsistencia);

      const resultado = await validateMovimiento({
        dni: '12345678',
        tipo: 'salida',
        fecha_hora: fechaRapida,
        Asistencia,
        Presencia,
      });

      expect(resultado.es_valido).toBe(false);
      expect(resultado.motivo).toContain('30 segundos');
    });
  });

  describe('Casos edge', () => {
    it('debe validar parámetros requeridos', async () => {
      await expect(
        validateMovimiento({
          dni: null,
          tipo: 'entrada',
          fecha_hora: new Date(),
          Asistencia,
          Presencia,
        })
      ).rejects.toThrow();
    });
  });
});

