const {
  validarDNI,
  validarCodigoUniversitario,
  validarEmail,
} = require('../../utils/validaciones');

describe('Utilidades de Validación', () => {
  describe('validarDNI', () => {
    it('debe aceptar DNI válido de 8 dígitos', () => {
      expect(validarDNI('12345678')).toBe(true);
      expect(validarDNI('87654321')).toBe(true);
    });

    it('debe rechazar DNI inválido', () => {
      expect(validarDNI('1234567')).toBe(false); // 7 dígitos
      expect(validarDNI('123456789')).toBe(false); // 9 dígitos
      expect(validarDNI('1234567a')).toBe(false); // contiene letra
      expect(validarDNI('')).toBe(false); // vacío
      expect(validarDNI(null)).toBe(false); // null
      expect(validarDNI(12345678)).toBe(false); // número en lugar de string
    });
  });

  describe('validarCodigoUniversitario', () => {
    it('debe aceptar código válido', () => {
      expect(validarCodigoUniversitario('20201234')).toBe(true);
      expect(validarCodigoUniversitario('20201234A')).toBe(true);
      expect(validarCodigoUniversitario('ABC12345')).toBe(true);
    });

    it('debe rechazar código inválido', () => {
      expect(validarCodigoUniversitario('1234567')).toBe(false); // menos de 8 caracteres
      expect(validarCodigoUniversitario('2020-1234')).toBe(false); // contiene guión
      expect(validarCodigoUniversitario('')).toBe(false); // vacío
      expect(validarCodigoUniversitario(null)).toBe(false); // null
    });
  });

  describe('validarEmail', () => {
    it('debe aceptar email válido', () => {
      expect(validarEmail('usuario@example.com')).toBe(true);
      expect(validarEmail('test.user@university.edu')).toBe(true);
      expect(validarEmail('user+tag@domain.co.uk')).toBe(true);
    });

    it('debe rechazar email inválido', () => {
      expect(validarEmail('invalid-email')).toBe(false);
      expect(validarEmail('@domain.com')).toBe(false);
      expect(validarEmail('user@')).toBe(false);
      expect(validarEmail('user @domain.com')).toBe(false); // espacio
      expect(validarEmail('')).toBe(false); // vacío
      expect(validarEmail(null)).toBe(false); // null
    });
  });
});

