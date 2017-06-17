console.log(`
  We are using Node.js ${process.versions.node},
  Chromium ${process.versions.chrome},
  and Electron ${process.versions.electron}.
`)

const adb = window.adb = require('./adb')

const qs = (selector) => document.querySelector(selector)

const status = qs('.status')
const holder = qs('.holder')

const reset = () => {
  if (!Object.keys(adb.tasks).length) {
    holder.classList.remove('active')
    holder.classList.add('ready')
  }
}

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

      let statusText = `device(s) ${
        connected ? '' : 'dis'
      }connected ${
        connected ? '👍' : '💩'
      }`

      if (Object.keys(adb.tasks).length) {
        statusText = 'transfering files...'
      }

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

    const card = document.createElement('div')
    card.setAttribute('class', 'card')
    holder.appendChild(card)

    adb.push({
      args: [f.path, dest],
      ondata: (data) => {
        const output = data.toString()
        const percent = output.substring(
          output.indexOf('(') + 1, output.indexOf('%')
        )
        card.innerHTML = `
          <span class='details'>
            ${percent}% transfering: "<span class='file'>${f.name}</span>" to ${dest}
          </span>
          <progress value='${percent}' max='100'>${percent} %</progress>
        `
      },
      onexit: (code) => {
        console.log(`Child exited with code ${code}`)
        holder.removeChild(card)
        reset()
      }
    }).then(uid => {
      card.onclick = (e) => {
        console.log(`close ${uid}`)
        e.preventDefault()
        adb.kill(uid)
      }
    })
  }
  return false
}
