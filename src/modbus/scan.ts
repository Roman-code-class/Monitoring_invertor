// src/modbus/scan.ts

import ModbusRTU from 'modbus-serial';

const portsToTry = ['COM3', 'COM4', 'COM5', 'COM6', 'COM7'];
const idsToTry = [1, 4];
const registerToTest = 25205; // Напряжение АКБ

const client = new ModbusRTU();

(async () => {
  for (const port of portsToTry) {
    for (const id of idsToTry) {
      try {
        console.log(`\nПробую ${port} с ID=${id}`);

        await client.connectRTUBuffered(port, {
          baudRate: 19200,       // ⬅️ обновлено
          parity: 'none',
          dataBits: 8,
          stopBits: 1,
        });
        client.setID(id);
        client.setTimeout(3000);

        const data = await client.readHoldingRegisters(registerToTest, 1);

        console.log(`✅ Найдено устройство!`);
        console.log(`Порт: ${port}, Slave ID: ${id}`);
        console.log(`Регистр ${registerToTest} (напряжение АКБ):`, data.data[0]);

        client.close();
        return; // Останавливаем поиск после первого найденного
      } catch (e: any) {
        console.warn(`❌ ${port} (ID=${id}): ${e.message}`);
        try { client.close(); } catch {}
      }
    }
  }

  console.log('\nНе удалось найти ни одного устройства.');
})();
