#!/usr/bin/env node
const {join} = require('path')
const pull = require('pull-stream')
const ssbClient = require('scuttlebot-release/node_modules/ssb-client')
const ssbKeys = require('scuttlebot-release/node_modules/ssb-keys')

const conf = require('rc')('tre')
const path = conf.config
if (!path) {
  console.error('.trerc not found')
  process.exit(1)
}
const keys = ssbKeys.loadSync(join(path, '../.tre/secret'))

if (!module.parent) {
  serial(conf, keys, err  => {
    if (err) {
      console.error('Serial returns error:', err.message)
      process.exit(1)
    }
  })
}

function serial(conf, keys, cb) {
  ssbClient(keys, Object.assign({},
    conf,
    {
      manifest: {
        serial: {
          open: 'duplex'
        }
      }
    }
  ), (err, ssb) => {
    if (err) return cb(err)
    const duplex = ssb.serial.open({device: 'ttyUSB0', baudRate: 57600})
    pull(
      duplex.source,
      pull.drain( data =>{
        process.stdout.write(data)
      }, err => {
        console.error('source ends with', err)
        ssb.close()
        cb(err)
      })
    )
  })
}

module.exports = serial
