const SerialPort = require('serialport')
const pull = require('pull-stream')
const toPull = require('stream-to-pull-stream')

const {join} = require('path')

// sbot plugin interface
exports.name = 'serial'
exports.version = require('./package.json').version
exports.manifest = {
  open: 'duplex'
}

exports.init = function (ssb, config) {
  const cfg = config.serial || {}

  function open(opts) {
    opts = Object.assign({}, cfg, opts)
    const devicePath = join('/dev/', opts.device)

    try {
      const serialPort = SerialPort(devicePath, opts)
      const duplex = toPull.duplex(serialPort)
      const source = pull(
        duplex.source,
        function(read) {
          return (abort, cb) => {
            read(abort, (end, data) => {
              if (end) {
                console.error('Source ended:', end)
                serialPort.close()
              }
              cb(end, data)
            })
          }
        }
      )
      return {source, sink: duplex.sink}
    } catch(e) {
      console.error(e)
      return pull.error(e)
    }
  }

  return {
    open
  }
}
