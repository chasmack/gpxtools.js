// pnezd.js - read/write PNEZD coordinate lists

const gdal = require('gdal');
const {Geometry, CoordinateTransformation, SpatialReference} = gdal;
const {fromWKT} = Geometry;

const parsePNEZD = (data, srcSRS) => {

  const linearUnits = srcSRS.getLinearUnits().value;

  const targetSRS = SpatialReference.fromEPSG(4326);

  const geom = [];
  data.trim().split(/\r?\n/).forEach(line => {
    line = line.trim();
    if (line !== '' && !line.startsWith('#')) {
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

const toPNEZD = (geom, targetSRS) => {

  const srcSRS = SpatialReference.fromEPSG(4326);
  const transform = new CoordinateTransformation(srcSRS, targetSRS);
  const linearUnits = targetSRS.getLinearUnits().value;

  let pts = '';
  geom.filter(g => g.geom.name == 'POINT').forEach(g => {
    let name = g.name;
    let coords = transform.transformPoint(g.geom.x, g.geom.y, g.geom.z);
    let ele = (g.ele / linearUnits).toFixed(4);
    let desc = g.desc || g.cmt || 'WAYPOINT';
    pts += `${name},${coords.y.toFixed(4)},${coords.x.toFixed(4)},${ele},${desc}\n`;
  });
  return pts;
};

module.exports = {parsePNEZD: parsePNEZD, toPNEZD: toPNEZD};
