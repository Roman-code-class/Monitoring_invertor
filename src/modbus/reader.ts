// src/modbus/reader.ts

import ModbusRTU from 'modbus-serial';
import fs from 'fs';
import path from 'path';

interface ModbusRegister {
  address: number;
  name: string;
  unit?: string;
  category?: string;
}

// Пример: читаем напряжение АКБ (один регистр)
const exampleRegister: ModbusRegister = {
  address: 25205,
  name: 'Напряжение АКБ',
  unit: 'V',
  category: 'status',
};

const port = 'COM3'; // COM-порт адаптера для конкретного инвертора
const slaveId = 4;   // Установлен в Modbus Poll

const client = new ModbusRTU();

async function readRegister(register: ModbusRegister) {
  try {
    // Подключение к COM-порту с параметрами, аналогичными Modbus Poll
    await client.connectRTUBuffered(port, {
      baudRate: 19200,
      parity: 'none',
      dataBits: 8,
      stopBits: 1,
    });

    client.setID(slaveId);     // Адрес устройства
    client.setTimeout(5000);   // Максимальное ожидание ответа (в мс)

    await delay(200); // Задержка перед опросом (как в Modbus Poll)

    const data = await client.readHoldingRegisters(register.address, 1);
    const rawValue = data.data[0];

    const result = {
      timestamp: new Date().toISOString(),
      inverter_port: port,
      inverter_id: `slave_${slaveId}`,
      category: register.category,
      address: register.address,
      name: register.name,
      unit: register.unit || '-',
      value: rawValue,
    };

    console.log('[Результат чтения регистра]', result);

    logResult(result);
    client.close();
  } catch (err) {
    console.error(`[Ошибка] ${new Date().toISOString()} –`, err);
    try { client.close(); } catch {}
  }
}

function logResult(entry: any) {
  const date = new Date();
  const folderName = path.join('logs', `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
  const fileName = path.join(folderName, `${String(date.getDate()).padStart(2, '0')}.jsonl`);

  if (!fs.existsSync(folderName)) fs.mkdirSync(folderName, { recursive: true });

  fs.appendFileSync(fileName, JSON.stringify(entry) + '\n');
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

readRegister(exampleRegister);