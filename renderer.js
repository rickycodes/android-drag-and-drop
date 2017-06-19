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
        : holder.classList.remove('ready', 'active')

      let statusText = `device(s) ${
        connected ? '' : 'dis'
      }connected`

      if (Object.keys(adb.tasks).length) {
        statusText = 'transfering files...'
      }

      status.innerText = statusText
      poll()
    })
  }, 1000)
}

poll()

const createCard = () => {
  const card = document.createElement('div')
  card.setAttribute('class', 'card')
  return card
}

const push = async (f, dest) => {
  const card = createCard()
  holder.appendChild(card)
  const uid = await adb.push({
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
  })

  card.setAttribute('data-uid', uid)
  card.addEventListener('click', (event) => {
    event.preventDefault()
    adb.kill(card.dataset.uid)
  })
}

holder.ondragover = () => {
  holder.classList.add('over')
  return false
}

holder.ondragleave = holder.ondragend = () => {
  holder.classList.remove('over')
  return false
}

holder.ondrop = (e) => {
  e.preventDefault()
  if (!connected || holder.classList.contains('active')) {
    return false
  }

  holder.classList.remove('ready', 'over')
  holder.classList.add('active')

  const dest = '/sdcard/'
  for (let f of e.dataTransfer.files) {
    console.log('File(s) you dragged here: ', f.path)
    push(f, dest)
  }
  return false
}
