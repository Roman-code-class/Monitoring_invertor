// src/modbus/daemon.ts

import cron from 'node-cron';
import { pollInverter } from './poller';
import config from '../config/config.json';
import fs from 'fs';
import path from 'path';

const LOG_FILE = path.join('logs', 'all.csv');
const MAX_AGE_MONTHS = 6;

function logEvent(message: string) {
  const date = new Date();
  const folderName = path.join('logs', 'events');
  const fileName = path.join(folderName, `${date.toISOString().split('T')[0]}-events.jsonl`);

  if (!fs.existsSync(folderName)) fs.mkdirSync(folderName, { recursive: true });

  const entry = {
    timestamp: date.toISOString(),
    event: message,
  };

  fs.appendFileSync(fileName, JSON.stringify(entry) + '\n');
}

function deleteOldEntriesFromAllCsv() {
  if (!fs.existsSync(LOG_FILE)) return;

  const now = new Date();
  const lines = fs.readFileSync(LOG_FILE, 'utf-8').split('\n');
  const headers = lines[0];
  const filtered = lines.filter((line, i) => {
    if (i === 0 || !line.trim()) return true; // keep header or empty line

    const parts = line.split(',');
    const timestamp = parts[0]?.replace(/"/g, '');
    const entryDate = new Date(timestamp);
    const ageMonths = (now.getFullYear() - entryDate.getFullYear()) * 12 + (now.getMonth() - entryDate.getMonth());

    return ageMonths < MAX_AGE_MONTHS;
  });

  fs.writeFileSync(LOG_FILE, filtered.join('\n'));
}

async function runPollCycle() {
  logEvent('🔄 Запуск опроса всех инверторов');
  for (const inverter of config.inverters) {
    await pollInverter(inverter, config.settings);
  }
  logEvent('✅ Опрос завершён');
}

logEvent('▶ Демон запущен');

// Опрос каждые 15 минут
cron.schedule('*/15 * * * *', () => {
  runPollCycle().catch((err) => logEvent(`❌ Ошибка цикла: ${err}`));
});

// Очистка логов каждые 6 месяцев (1 января и 1 июля в 4 утра)
cron.schedule('0 4 1 1,7 *', () => {
  logEvent('🧹 Запущена полугодовая очистка логов');
  try {
    // Удаление всех подпапок внутри logs
    const logsDir = path.join('logs');
    if (fs.existsSync(logsDir)) {
      fs.readdirSync(logsDir).forEach(item => {
        const itemPath = path.join(logsDir, item);
        if (fs.statSync(itemPath).isDirectory()) {
          fs.rmSync(itemPath, { recursive: true, force: true });
        }
      });
    }

    // Очистка all.csv, но оставляем заголовок
    const allPath = path.join(logsDir, 'all.csv');
    if (fs.existsSync(allPath)) {
      const content = fs.readFileSync(allPath, 'utf-8');
      const [header] = content.split('\n');
      fs.writeFileSync(allPath, header + '\n', 'utf-8');
    }

    logEvent('✅ Полугодовая очистка завершена');
  } catch (err) {
    logEvent(`❌ Ошибка очистки логов: ${err}`);
  }
});

