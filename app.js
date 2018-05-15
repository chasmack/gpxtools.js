const fs = require('fs');
const path = require('path');

const gdal = require('gdal');
const {SpatialReference} = gdal;

const {readGPX, writeGPX} = require('./lib/gpx.js');
const {readPNEZD, writePNEZD} = require('./lib/pnezd.js');

const GPX_FILE = path.resolve(__dirname, 'data/gpsmap.gpx');
const TARGET_SRS = SpatialReference.fromEPSG(2229);

new Promise((resolve, reject) => {
  fs.readFile(GPX_FILE, (err, gpx) => {
    if (err) {
      return reject(err);
    }
    resolve(gpx);
  });

}).then(gpx => {
  return readGPX(gpx);

}).then(geom => {
  return writePNEZD(geom, TARGET_SRS);

}).then(pts => {
  return readPNEZD(pts, TARGET_SRS);

}).then(geom => {
  console.log(geom);

}).catch(err => {
  console.log(err);
});
