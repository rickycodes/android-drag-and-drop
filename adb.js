const { exec, spawn } = require('child_process')
const uid = require('uid-promise')
const cmd = 'adb'
const adb = { tasks: {} }
const noop = () => {}

adb.push = (opts) => {
  return new Promise(async (resolve, reject) => {
    opts = opts || {}
    opts.args = opts.args || [ '/dev/null', '/sdcard/' ]
    opts.onexit = opts.onexit || noop
    const id = await uid(20)
    const push = adb.tasks[id] = spawn(cmd, [ 'push', '-p', ...opts.args ])
    push.stderr.on('data', opts.ondata || noop)
    push.stdout.on('data', opts.ondata || noop)
    push.on('exit', (code) => {
      opts.onexit(code)
      delete adb.tasks[id]
    })
    resolve(id)
  })
}

adb.devices = () => {
  return new Promise(async (resolve, reject) => {
    const id = await uid(20)
    adb.tasks[id] = exec(`${cmd} devices`, (error, stdout, stderr) => {
      if (error) reject(error)
      resolve(stdout)
      delete adb.tasks[id]
    })
  })
}

adb.list = adb.devices // alias

adb.kill = (id) => {
  if (adb.tasks.hasOwnProperty(id)) {
    adb.tasks[id].kill()
    delete adb.tasks[id]
  }
}

module.exports = adb
