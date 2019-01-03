#!/usr/bin/env node

const { spawn } = require('child_process')
const { join } = require('path')

spawn(process.execPath, ['-r', join(__dirname, 'monitor.js')].concat(process.argv.slice(2)), {
  stdio: 'inherit'
})
