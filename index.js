const os = require('os')
const p = require('prettier-bytes')
const eld = require('event-loop-delay')
const hrtime = require('./hrtime')

const isBare = !!global.Bare
const resourceUsage = isBare ? os.resourceUsage : global.process.resourceUsage
const threadCpuUsage = (isBare ? os.threadCpuUsage : global.process.threadCpuUsage) || (() => ({ user: 0, system: 0 }))
const memoryUsage = isBare ? os.memoryUsage : global.process.memoryUsage
const pid = isBare ? global.Bare.pid : global.process.pid
const argv = isBare ? global.Bare.argv : global.process.argv

module.exports = top

function top (opts) {
  if (!opts) opts = {}

  const tick = opts.interval || 1000
  const started = Date.now()
  const interval = setInterval(perSecond, tick)

  const win = [{ time: hrtime(), cpu: cpuUsage(null), cpuThread: threadCpuUsage(null), delay: 0 }, null, null, null]
  const loopSampler = eld()

  let sec = 1
  let cpus = 0

  try {
    cpus = os.availableParallelism()
  } catch {
    // might crash on android for permission...
  }

  interval.unref()

  return {
    pid,
    command: argv.join(' '),
    started,
    cpus,
    runtime () {
      return Date.now() - started
    },
    delay () {
      const btm = oldest()
      const timeDelta = hrtime(win[btm].time)
      const ms = Math.max(1, timeDelta[0] * 1e3 + Math.floor(timeDelta[1] / 1e6))
      return Math.floor((loopSampler.delay - win[btm].delay) / (ms / tick))
    },
    cpu () {
      const btm = oldest()
      const cpuDelta = cpuUsage(win[btm].cpu)
      const timeDelta = hrtime(win[btm].time)
      const us = timeDelta[0] * 1e6 + timeDelta[1] / 1e3
      return {
        time: us,
        percent: (cpuDelta.system + cpuDelta.user) / us,
        system: cpuDelta.system,
        user: cpuDelta.user
      }
    },
    cpuThread () {
      const btm = oldest()
      const cpuDelta = threadCpuUsage(win[btm].cpuThread)
      const timeDelta = hrtime(win[btm].time)
      const us = timeDelta[0] * 1e6 + timeDelta[1] / 1e3
      return {
        time: us,
        percent: (cpuDelta.system + cpuDelta.user) / us,
        system: cpuDelta.system,
        user: cpuDelta.user
      }
    },
    memory () {
      const mem = memoryUsage()
      const total = os.totalmem()

      return {
        percent: (mem.rss || 0) / total,
        rss: mem.rss || 0,
        total,
        heapPercent: mem.heapUsed / mem.heapTotal,
        heapUsed: mem.heapUsed,
        heapTotal: mem.heapTotal,
        external: mem.external
      }
    },
    loadavg () {
      return os.loadavg()
    },
    destroy () {
      clearInterval(interval)
    },
    toString () {
      const mem = this.memory()
      return `cpu: ${pct(this.cpu().percent)} | rss: ${p(mem.rss)} (${pct(mem.percent)}) | heap: ${p(mem.heapUsed)} / ${p(mem.heapTotal)} (${pct(mem.heapPercent)}) | ext: ${p(mem.external)} | delay: ${this.delay()} ms | ${time(this.runtime())} | loadavg: ${os.loadavg().map(fixed2).join(', ')}`
    },
    toJSON () {
      const memory = this.memory()
      return {
        timestamp: new Date(),
        cpu: Number(this.cpu().percent.toFixed(4)),
        memory: { ...memory, percent: Number(memory.percent.toFixed(4)), heapPercent: Number(memory.heapPercent.toFixed(4)) },
        delay: this.delay(),
        runtime: this.runtime()
      }
    }
  }

  function oldest () {
    let btm = (sec - 4) & 3
    while (!win[btm]) btm = (btm + 1) & 3
    return btm
  }

  function perSecond () {
    const ptr = sec++ & 3
    win[ptr] = { time: hrtime(), cpu: cpuUsage(null), cpuThread: threadCpuUsage(null), delay: loopSampler.delay }
  }
}

function pct (n) {
  return (100 * n).toFixed(1) + '%'
}

function fixed2 (n) {
  return n.toFixed(2)
}

function time (n) {
  let secs = Math.floor(n / 1000)
  const hours = Math.floor(secs / 3600)
  secs -= hours * 3600
  const mins = Math.floor(secs / 60)
  secs -= mins * 60
  return pad(hours) + ':' + pad(mins) + ':' + pad(secs)
}

function pad (n) {
  return n < 10 ? '0' + n : '' + n
}

function cpuUsage (previous) {
  const current = resourceUsage()

  const result = {
    user: current.userCPUTime,
    system: current.systemCPUTime
  }

  if (!previous) return result

  return {
    user: result.user - previous.user,
    system: result.system - previous.system
  }
}
