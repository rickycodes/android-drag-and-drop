console.log(`
  We are using Node.js ${process.versions.node},
  Chromium ${process.versions.chrome},
  and Electron ${process.versions.electron}.
`)

const adb = window.adb = require('./adb')

const qs = (selector) => document.querySelector(selector)
// const { dialog } = require('electron').remote

const status = qs('.status')
const holder = qs('.holder')

let connected = false

const poll = () => {
  setTimeout(() => {
    adb.list().then(output => {
      const lineBreak = '\n'
      connected = output.substring(
        output.indexOf(lineBreak), output.length
      ).replace(lineBreak, '').length > 1

      connected
        ? holder.classList.add('ready')
        : holder.classList.remove('ready')

      const statusText = `device(s) ${
        connected ? '' : 'dis'
      }connected ${
        connected ? '👍' : '💩'
      }`

      status.innerText = statusText
      poll()
    })
  }, 1000)
}

poll()

holder.ondragover = () => false
holder.ondragleave = holder.ondragend = () => false
holder.ondrop = (e) => {
  e.preventDefault()
  if (!connected || holder.classList.contains('active')) {
    return false
  }

  holder.classList.remove('ready')
  holder.classList.add('active')

  const dest = '/sdcard/'
  for (let f of e.dataTransfer.files) {
    console.log('File(s) you dragged here: ', f.path)
    adb.push({
      args: [f.path, dest],
      ondata: (data) => {
        const output = data.toString()
        const percent = output.substring(
          output.indexOf('(') + 1, output.indexOf('%')
        )
        holder.innerHTML = `
          <div>
            <progress value='${percent}' max='100'>
              ${percent} %
            </progress>
            <br />
            ${percent}%
            <br />
            <small>Transfering: "${f.name}" to ${dest}</small>
          </div>
        `
      },
      onexit: (code) => {
        console.log(`Child exited with code ${code}`)
        holder.classList.remove('active')
        holder.classList.add('ready')
        holder.innerHTML = ''
      }
    }).then(uid => {
      console.log(uid)
    })
  }
  return false
}
