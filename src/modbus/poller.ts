// src/modbus/poller.ts

import ModbusRTU from 'modbus-serial';
import fs from 'fs';
import path from 'path';
import config from '../config/config.json';
import { readableRegisters, ModbusRegister } from '../config/registers';

function getMoscowTime() {
  const now = new Date();
  const offsetMs = 3 * 60 * 60 * 1000; // UTC+3
  const moscowDate = new Date(now.getTime() + offsetMs);
  const iso = moscowDate.toISOString();

  const local = moscowDate.toLocaleString('ru-RU', {
    timeZone: 'Europe/Moscow',
    hour12: false,
  }).replace(',', '');

  return { iso, local };
}

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

        const { iso, local } = getMoscowTime();

        const result = {
          timestamp: iso,
          local_time: local,
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
        const { iso, local } = getMoscowTime();
        logResult({
          timestamp: iso,
          local_time: local,
          inverter_name: inverter.name,
          category: 'error',
          message: `Ошибка чтения регистра ${reg.address}: ${err}`
        });
      }
    }

    if (client.isOpen) client.close();
  } catch (err) {
    const { iso, local } = getMoscowTime();
    logResult({
      timestamp: iso,
      local_time: local,
      inverter_name: inverter.name,
      category: 'error',
      message: `Ошибка подключения: ${err}`
    });
    try { if (client.isOpen) client.close(); } catch {}
  }
}

function logResult(entry: any) {
  const date = new Date();
  const folderName = path.join('logs', `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
  const fileName = path.join(folderName, `${String(date.getDate()).padStart(2, '0')}.csv`);
  const allFile = path.join('logs', 'all.csv');
  const latestFile = path.join('logs', 'latest.csv');

  if (!fs.existsSync(folderName)) fs.mkdirSync(folderName, { recursive: true });

  const headers = ['timestamp', 'local_time', 'inverter_name', 'inverter_port', 'inverter_id', 'category', 'address', 'name', 'unit', 'value', 'message'];

  const row = headers.map(key => {
    const val = entry[key];
    return typeof val === 'string' ? `"${val}"` : (val !== undefined ? val : '');
  }).join(',');

  // Добавление заголовков, если файл новый
  const writeWithHeader = (filePath: string) => {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, headers.join(',') + '\n');
    }
    fs.appendFileSync(filePath, row + '\n');
  };

  writeWithHeader(fileName);   // по дням
  writeWithHeader(allFile);    // общий для Grafana
  // fs.copyFileSync(fileName, latestFile); // последний лог
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

(async () => {
  for (const inverter of config.inverters) {
    await pollInverter(inverter, config.settings);
    await delay(config.settings.pauseBetweenInvertersMs);
  }
})();

export { pollInverter };
