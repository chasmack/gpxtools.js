// pnezd.js - read/write PNEZD coordinate lists

const gdal = require('gdal');
const {Geometry, CoordinateTransformation, SpatialReference} = gdal;
const {fromWKT} = Geometry;


const readPNEZD = (data, srcSRS) => {

  const linearUnits = srcSRS.getLinearUnits().value;

  const targetSRS = SpatialReference.fromEPSG(4326);

  const geom = [];
  data.split(/\r?\n/).forEach(line => {
    if (line !== '') {
      const [name, y, x, ele, desc] = line.split(',');
      geom.push({
        name: name,
        geom: fromWKT(`POINT (${x} ${y})`, srcSRS),
        ele: ele ? parseFloat(ele) * linearUnits : undefined,
        desc: desc
      });
    }
  });
  geom.forEach(g => g.geom.transformTo(targetSRS));
  return geom;
};

const writePNEZD = (geom, targetSRS) => {

  const srcSRS = SpatialReference.fromEPSG(4326);
  const transform = new CoordinateTransformation(srcSRS, targetSRS);
  const linearUnits = targetSRS.getLinearUnits().value;

  let pts = '';
  geom.forEach(g => {
    if (g.geom.name === 'POINT') {
      let name = parseInt(g.name);
      let coords = transform.transformPoint(g.geom.x, g.geom.y, g.geom.z);
      let ele = (g.ele / linearUnits).toFixed(4);
      let desc = g.desc || g.cmt || 'WAYPOINT';
      pts += `${name},${coords.y.toFixed(4)},${coords.x.toFixed(4)},${ele},${desc}\n`;
    }
  });
  return pts;
};

module.exports = {readPNEZD: readPNEZD, writePNEZD: writePNEZD};
