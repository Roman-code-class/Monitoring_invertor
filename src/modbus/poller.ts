// src/modbus/poller.ts

import ModbusRTU from 'modbus-serial';
import fs from 'fs';
import path from 'path';
import config from '../config/config.json';
import { readableRegisters, ModbusRegister } from '../config/registers';

async function pollInverter(inverter: any, settings: any) {
  const client = new ModbusRTU();
  try {
    console.log(`\n🔌 Подключение к ${inverter.name} (${inverter.port})`);

    await client.connectRTUBuffered(inverter.port, {
      baudRate: settings.baudRate,
      parity: settings.parity,
      dataBits: settings.dataBits,
      stopBits: settings.stopBits,
    });

    client.setID(inverter.slaveId);
    client.setTimeout(5000);

    for (const reg of readableRegisters) {
      await delay(settings.pollDelayMs);
      try {
        const data = await client.readHoldingRegisters(reg.address, 1);
        const rawValue = data.data[0];
        const value = reg.scale ? rawValue * reg.scale : rawValue;

        const result = {
          timestamp: new Date().toISOString(),
          inverter_name: inverter.name,
          inverter_port: inverter.port,
          inverter_id: `slave_${inverter.slaveId}`,
          category: reg.category,
          address: reg.address,
          name: reg.name,
          unit: reg.unit || '-',
          value: value,
        };

        console.log(result);
        logResult(result);
      } catch (err) {
        logResult({
          timestamp: new Date().toISOString(),
          inverter_name: inverter.name,
          category: 'error',
          message: `Ошибка чтения регистра ${reg.address}: ${err}`
        });
      }
    }

    client.close();
  } catch (err) {
    logResult({
      timestamp: new Date().toISOString(),
      inverter_name: inverter.name,
      category: 'error',
      message: `Ошибка подключения: ${err}`
    });
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

// Запуск опроса всех инверторов
(async () => {
  for (const inverter of config.inverters) {
    await pollInverter(inverter, config.settings);
    await delay(config.settings.pauseBetweenInvertersMs);
  }
})();

export { pollInverter };
