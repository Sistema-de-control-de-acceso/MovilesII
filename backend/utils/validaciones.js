/**
 * Utilidades de validación para movimientos y asistencias
 */

/**
 * Valida coherencia de un movimiento (entrada/salida)
 * @param {Object} params - Parámetros de validación
 * @param {string} params.dni - DNI del estudiante
 * @param {string} params.tipo - Tipo de movimiento ('entrada' o 'salida')
 * @param {Date} params.fecha_hora - Fecha y hora del movimiento
 * @param {Object} params.Asistencia - Modelo de Asistencia
 * @param {Object} params.Presencia - Modelo de Presencia
 * @returns {Promise<Object>} Resultado de la validación
 */
async function validateMovimiento({ dni, tipo, fecha_hora, Asistencia, Presencia }) {
  if (!dni || !tipo || !fecha_hora) {
    throw new Error('Faltan parámetros requeridos: dni, tipo, fecha_hora');
  }

  const fechaMovimiento = new Date(fecha_hora);

  // 1. Verificar estado de presencia actual (fuente más confiable)
  const presenciaActual = await Presencia.findOne({ estudiante_dni: dni, esta_dentro: true });

  if (presenciaActual) {
    // Estudiante está registrado como dentro del campus
    if (tipo === 'entrada') {
      return {
        es_valido: false,
        tipo_sugerido: 'salida',
        motivo: 'El estudiante ya se encuentra registrado dentro del campus. No se puede registrar otra entrada.',
        requiere_autorizacion_manual: true,
        presencia_actual: {
          hora_entrada: presenciaActual.hora_entrada,
          punto_entrada: presenciaActual.punto_entrada,
        },
      };
    }
    // Si es salida, validar coherencia temporal con la entrada
    if (fechaMovimiento < presenciaActual.hora_entrada) {
      return {
        es_valido: false,
        tipo_sugerido: 'salida',
        motivo: 'La fecha/hora de salida no puede ser anterior a la hora de entrada',
        requiere_autorizacion_manual: true,
      };
    }
  } else {
    // Estudiante NO está registrado como dentro
    if (tipo === 'salida') {
      return {
        es_valido: false,
        tipo_sugerido: 'entrada',
        motivo: 'No se puede registrar salida sin registro previo de entrada',
        requiere_autorizacion_manual: true,
      };
    }
  }

  // 2. Validar con último movimiento en asistencias (para coherencia adicional)
  const ultimaAsistencia = await Asistencia.findOne({ dni }).sort({ fecha_hora: -1 });

  if (ultimaAsistencia) {
    // Validar coherencia temporal - fecha no puede ser anterior al último registro
    if (fechaMovimiento < ultimaAsistencia.fecha_hora) {
      return {
        es_valido: false,
        tipo_sugerido: ultimaAsistencia.tipo === 'entrada' ? 'salida' : 'entrada',
        motivo: 'La fecha/hora del movimiento es anterior al último registro',
        requiere_autorizacion_manual: true,
        ultimo_registro: {
          tipo: ultimaAsistencia.tipo,
          fecha_hora: ultimaAsistencia.fecha_hora,
        },
      };
    }

    // Validar secuencia lógica - no puede haber dos movimientos del mismo tipo consecutivos
    if (ultimaAsistencia.tipo === tipo) {
      const tipoEsperado = ultimaAsistencia.tipo === 'entrada' ? 'salida' : 'entrada';
      return {
        es_valido: false,
        tipo_sugerido: tipoEsperado,
        motivo: `El último movimiento fue ${ultimaAsistencia.tipo}. El siguiente debe ser ${tipoEsperado}`,
        requiere_autorizacion_manual: true,
      };
    }

    // Validar tiempo mínimo entre movimientos (30 segundos)
    const diferencia = fechaMovimiento.getTime() - ultimaAsistencia.fecha_hora.getTime();
    if (diferencia < 30000) {
      // 30 segundos en milisegundos
      return {
        es_valido: false,
        tipo_sugerido: tipo,
        motivo: 'Movimiento registrado muy rápido después del anterior. Esperar al menos 30 segundos',
        requiere_autorizacion_manual: false,
        diferencia_segundos: Math.floor(diferencia / 1000),
      };
    }
  }

  // 3. Todo correcto - validación pasada
  return {
    es_valido: true,
    tipo_sugerido: tipo,
    motivo: null,
    requiere_autorizacion_manual: false,
    estado_presencia: presenciaActual ? 'dentro' : 'fuera',
  };
}

/**
 * Valida formato de DNI
 * @param {string} dni - DNI a validar
 * @returns {boolean} True si es válido
 */
function validarDNI(dni) {
  if (!dni || typeof dni !== 'string') return false;
  // DNI peruano: 8 dígitos
  const dniRegex = /^\d{8}$/;
  return dniRegex.test(dni);
}

/**
 * Valida formato de código universitario
 * @param {string} codigo - Código a validar
 * @returns {boolean} True si es válido
 */
function validarCodigoUniversitario(codigo) {
  if (!codigo || typeof codigo !== 'string') return false;
  // Código universitario: mínimo 8 caracteres alfanuméricos
  const codigoRegex = /^[A-Z0-9]{8,}$/;
  return codigoRegex.test(codigo.toUpperCase());
}

/**
 * Valida formato de email
 * @param {string} email - Email a validar
 * @returns {boolean} True si es válido
 */
function validarEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

module.exports = {
  validateMovimiento,
  validarDNI,
  validarCodigoUniversitario,
  validarEmail,
};

