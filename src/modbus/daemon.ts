// src/modbus/daemon.ts

import cron from 'node-cron';
import { pollInverter } from './poller';
import config from '../config/config.json';
import fs from 'fs';
import path from 'path';

function logEvent(message: string) {
  const date = new Date();
  const folderName = path.join('logs', `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
  const fileName = path.join(folderName, `${String(date.getDate()).padStart(2, '0')}-events.jsonl`);

  if (!fs.existsSync(folderName)) fs.mkdirSync(folderName, { recursive: true });

  const entry = {
    timestamp: date.toISOString(),
    event: message,
  };

  fs.appendFileSync(fileName, JSON.stringify(entry) + '\n');
}

async function runPollCycle() {
  logEvent('🔄 Запуск опроса всех инверторов');
  for (const inverter of config.inverters) {
    await pollInverter(inverter, config.settings);
  }
  logEvent('✅ Опрос завершён');
}

logEvent('▶ Демон запущен');

cron.schedule('*/15 * * * *', () => {
  runPollCycle().catch((err) => logEvent(`❌ Ошибка цикла: ${err}`));
});
