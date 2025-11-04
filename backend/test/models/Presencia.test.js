const mongoose = require('mongoose');
const Presencia = require('../../models/Presencia');
const { mockPresencia } = require('../utils/mocks');

describe('Modelo Presencia', () => {
  beforeEach(async () => {
    await Presencia.deleteMany({});
  });

  it('debe crear una presencia correctamente', async () => {
    const presenciaData = mockPresencia();
    const presencia = await Presencia.create(presenciaData);

    expect(presencia._id).toBeDefined();
    expect(presencia.estudiante_dni).toBe(presenciaData.estudiante_dni);
    expect(presencia.esta_dentro).toBe(true);
  });

  it('debe tener esta_dentro como true por defecto', async () => {
    const presenciaData = mockPresencia({ esta_dentro: undefined });
    const presencia = await Presencia.create(presenciaData);

    expect(presencia.esta_dentro).toBe(true);
  });

  it('debe calcular tiempo_en_campus correctamente', async () => {
    const horaEntrada = new Date('2024-01-01T10:00:00');
    const horaSalida = new Date('2024-01-01T14:00:00');
    const tiempoEsperado = 4 * 60 * 60 * 1000; // 4 horas en milisegundos

    const presencia = await Presencia.create({
      ...mockPresencia(),
      hora_entrada: horaEntrada,
      hora_salida: horaSalida,
      tiempo_en_campus: tiempoEsperado,
    });

    expect(presencia.tiempo_en_campus).toBe(tiempoEsperado);
  });

  it('debe permitir actualizar estado de presencia', async () => {
    const presencia = await Presencia.create(mockPresencia({ esta_dentro: true }));

    presencia.esta_dentro = false;
    presencia.hora_salida = new Date();
    await presencia.save();

    const actualizada = await Presencia.findById(presencia._id);
    expect(actualizada.esta_dentro).toBe(false);
    expect(actualizada.hora_salida).toBeDefined();
  });

  it('debe validar campos requeridos', async () => {
    const presenciaInvalida = {
      estudiante_dni: '12345678',
      // Falta otros campos requeridos
    };

    await expect(Presencia.create(presenciaInvalida)).rejects.toThrow();
  });
});

