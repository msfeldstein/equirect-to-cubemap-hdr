#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const getPixels = require('get-pixels')
const EquirectToCubemapFaces = require('./equirect-to-cube')

const input = process.argv[2]
const outputResolution = parseInt(process.argv[3]) || 256

if (!input || input == '-h') {
  console.log("Usage: equirect-to-cubemap path/to/equirect.hdr [output resolution]")
  return
}

console.log(`>> Generating maps for ${input} at ${outputResolution}px`)

const cubeSplitter = require('../cube-splitter')()

const file = fs.createReadStream(input)
file.pipe(hdrLoader)
