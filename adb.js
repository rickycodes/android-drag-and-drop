const { exec, spawn } = require('child_process')
const uid = require('uid-promise')
const cmd = 'adb'
const adb = { tasks: {} }
const noop = () => {}

adb.push = (opts) => {
  return new Promise((resolve, reject) => {
    opts = opts || {}
    opts.args = opts.args || [ '/dev/null', '/sdcard/' ]
    opts.onexit = opts.onexit || noop
    uid(20).then(uid => {
      const push = adb.tasks[uid] = spawn(cmd, [ 'push', '-p', ...opts.args ])
      push.stderr.on('data', opts.ondata || noop)
      push.stdout.on('data', opts.ondata || noop)
      push.on('exit', (code) => {
        opts.onexit(code)
        delete adb.tasks[uid]
      })
      resolve(uid)
    })
  })
}

adb.devices = () => {
  return new Promise((resolve, reject) => {
    uid(20).then(uid => {
      adb.tasks[uid] = exec(`${cmd} devices`, (error, stdout, stderr) => {
        if (error) reject(error)
        resolve(stdout)
        delete adb.tasks[uid]
      })
    })
  })
}

adb.list = adb.devices // alias

adb.kill = (uuid) => {
  if (adb.tasks.hasOwnProperty(uuid)) adb.tasks[uuid].kill()
  delete adb.tasks[uuid]
}

module.exports = adb
