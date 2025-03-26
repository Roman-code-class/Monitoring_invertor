// src/config/registers.ts

export interface ModbusRegister {
  address: number;
  name: string;
  unit?: string;
  category: string;
  scale?: number;
}

export const readableRegisters: ModbusRegister[] = [
  // === Информация об устройстве ===
  { address: 20000, name: 'Тип устройства (старший байт)', category: 'info' },
  { address: 20001, name: 'Тип устройства (младший байт)', category: 'info' },
  { address: 20002, name: 'Серийный номер (старший байт)', category: 'info' },
  { address: 20003, name: 'Серийный номер (младший байт)', category: 'info' },
  { address: 20004, name: 'Версия оборудования', category: 'info' },
  { address: 20005, name: 'Версия программного обеспечения', category: 'info' },
  { address: 20006, name: 'Версия протокола', category: 'info' },

  // === Текущий статус ===
  { address: 25201, name: 'Состояние работы', category: 'status' },
  { address: 25205, name: 'Напряжение АКБ', unit: 'V', category: 'status', scale: 1 },
  { address: 25206, name: 'Выходное напряжение инвертора', unit: 'V', category: 'status', scale: 1 },
  { address: 25207, name: 'Сетевое напряжение', unit: 'V', category: 'status', scale: 1 },
  { address: 25210, name: 'Ток инвертора', unit: 'A', category: 'status', scale: 1 },
  { address: 25213, name: 'Мощность инвертора', unit: 'W', category: 'status' },
  { address: 25214, name: 'Мощность сети', unit: 'W', category: 'status' },
  { address: 25215, name: 'Мощность нагрузки', unit: 'W', category: 'status' },
  { address: 25216, name: 'Процент нагрузки', unit: '%', category: 'status', scale: 1 },
  { address: 25233, name: 'Температура радиатора AC', unit: 'C', category: 'status', scale: 1 },
  { address: 25234, name: 'Температура трансформатора', unit: 'C', category: 'status', scale: 1 },
  { address: 25235, name: 'Температура радиатора DC', unit: 'C', category: 'status', scale: 1 },

  // === Энергия / накопленные данные ===
  { address: 25245, name: 'Накопленная зарядная энергия (старший байт)', unit: 'kWh', category: 'energy' },
  { address: 25246, name: 'Накопленная зарядная энергия (младший байт)', unit: 'kWh', category: 'energy' },
  { address: 25247, name: 'Накопленная разрядная энергия (старший байт)', unit: 'kWh', category: 'energy' },
  { address: 25248, name: 'Накопленная разрядная энергия (младший байт)', unit: 'kWh', category: 'energy' },
  { address: 25253, name: 'Накопленная нагрузочная энергия (старший байт)', unit: 'kWh', category: 'energy' },
  { address: 25254, name: 'Накопленная нагрузочная энергия (младший байт)', unit: 'kWh', category: 'energy' },

  // === Ошибки и предупреждения ===
  { address: 25261, name: 'Сообщение об ошибке 1', category: 'error' },
  { address: 25262, name: 'Сообщение об ошибке 2', category: 'error' },
  { address: 25265, name: 'Сообщение о предупреждении 1', category: 'error' },
  { address: 25266, name: 'Сообщение о предупреждении 2', category: 'error' },
];
