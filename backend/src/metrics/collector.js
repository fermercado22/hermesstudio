const si = require('systeminformation');

let cachedStatic = null;

async function getStaticInfo() {
  if (cachedStatic) return cachedStatic;
  const [cpu, os, mem] = await Promise.all([
    si.cpu(),
    si.osInfo(),
    si.memLayout(),
  ]);
  cachedStatic = { cpu, os, memSlots: mem.length };
  return cachedStatic;
}

async function getLiveMetrics() {
  const [cpu, mem, disk, net, processes, temp] = await Promise.all([
    si.currentLoad(),
    si.mem(),
    si.fsSize(),
    si.networkStats(),
    si.processes(),
    si.cpuTemperature().catch(() => ({ main: null })),
  ]);

  const mainDisk = disk.filter(d => d.size > 0).slice(0, 4);
  const mainNet = net.slice(0, 2);

  return {
    timestamp: Date.now(),
    cpu: {
      load: parseFloat(cpu.currentLoad.toFixed(1)),
      loadUser: parseFloat(cpu.currentLoadUser.toFixed(1)),
      loadSystem: parseFloat(cpu.currentLoadSystem.toFixed(1)),
      cores: cpu.cpus.map(c => parseFloat(c.load.toFixed(1))),
      temperature: temp.main,
    },
    memory: {
      total: mem.total,
      used: mem.used,
      free: mem.free,
      swapTotal: mem.swaptotal,
      swapUsed: mem.swapused,
      usedPercent: parseFloat(((mem.used / mem.total) * 100).toFixed(1)),
    },
    disks: mainDisk.map(d => ({
      fs: d.fs,
      mount: d.mount,
      size: d.size,
      used: d.used,
      usedPercent: parseFloat(d.use.toFixed(1)),
    })),
    network: mainNet.map(n => ({
      iface: n.iface,
      rxSec: n.rx_sec,
      txSec: n.tx_sec,
      rxBytes: n.rx_bytes,
      txBytes: n.tx_bytes,
    })),
    processes: {
      total: processes.all,
      running: processes.running,
      sleeping: processes.sleeping,
      top: processes.list
        .sort((a, b) => b.cpu - a.cpu)
        .slice(0, 8)
        .map(p => ({ pid: p.pid, name: p.name, cpu: parseFloat(p.cpu.toFixed(1)), mem: parseFloat(p.mem.toFixed(1)) })),
    },
  };
}

module.exports = { getLiveMetrics, getStaticInfo };
