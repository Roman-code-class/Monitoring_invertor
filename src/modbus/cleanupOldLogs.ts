import fs from 'fs';
import path from 'path';

const LOGS_DIR = path.join(__dirname, '../../logs');
const MONTHS_TO_KEEP = 6;

function getFolderDate(folderName: string): Date | null {
  const match = folderName.match(/^(\d{4})-(\d{2})$/);
  if (!match) return null;
  const [_, year, month] = match;
  return new Date(parseInt(year), parseInt(month) - 1);
}

function deleteOldFolders() {
  if (!fs.existsSync(LOGS_DIR)) return;

  const folders = fs.readdirSync(LOGS_DIR);
  const now = new Date();

  for (const folder of folders) {
    const folderPath = path.join(LOGS_DIR, folder);
    const folderDate = getFolderDate(folder);
    if (!folderDate) continue;

    const ageInMonths =
      (now.getFullYear() - folderDate.getFullYear()) * 12 +
      (now.getMonth() - folderDate.getMonth());

    if (ageInMonths > MONTHS_TO_KEEP) {
      console.log(`🧹 Удаляем папку: ${folderPath}`);
      fs.rmSync(folderPath, { recursive: true, force: true });
    }
  }
}

// Если запущен как отдельный скрипт
if (require.main === module) {
  deleteOldFolders();
}

export { deleteOldFolders };
