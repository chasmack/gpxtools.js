const fs = require('fs');
const path = require('path');

const gdal = require('gdal');
const {SpatialReference} = gdal;

const {parseGPX, toGPX} = require('./lib/gpx.js');
const {parsePNEZD, toPNEZD} = require('./lib/pnezd.js');

const GPX_INFILE = path.resolve(__dirname, 'data/gpsmap.gpx');
const PTS_INFILE = path.resolve(__dirname, 'data/gpsmap.csv');
const GPX_OUTFILE = path.resolve(__dirname, 'data/out.gpx');
const PTS_OUTFILE = path.resolve(__dirname, 'data/out.csv');
const TARGET_SRS = SpatialReference.fromEPSG(2229);

const readFile = (filename) => new Promise((resolve, reject) => {
  fs.readFile(filename, 'utf8', (err, data) => (err ? reject(err) : resolve(data)));
});

const writeFile = (filename, data) => new Promise((resolve, reject) => {
  fs.writeFile(filename, data, 'utf8', (err) => (err ? reject(err) : resolve()));
});

readFile(GPX_INFILE)
  .then(gpx  => parseGPX(gpx))
  .then(geom => toPNEZD(geom, TARGET_SRS))
  .then(pts  => {
    console.log(pts);
    return writeFile(PTS_OUTFILE, pts);
  })
  .then(()   => readFile(PTS_INFILE))
  .then(pts  => parsePNEZD(pts, TARGET_SRS))
  .then(geom => toGPX(geom))
  .then(gpx  => {
    console.log(gpx);
    return writeFile(GPX_OUTFILE, gpx);
  })
  .catch(err => console.log(err));
