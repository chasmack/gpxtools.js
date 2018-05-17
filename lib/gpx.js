// gpx.js - read/write GPX data

const xml2js = require('xml2js');
const builder = require('xmlbuilder');
const gdal = require('gdal');
const {Geometry, SpatialReference} = gdal;
const {fromWKT} = Geometry;

// Read GPX data into a list of geometry objects.

const parseGPX = (gpx) => new Promise((resolve, reject) => {
    
  const parser = new xml2js.Parser();
  parser.parseString(gpx, (err, result) => {
    if (err) {
      return reject(err);
    }

    const srcSRS = SpatialReference.fromEPSG(4326);

    const getAttr = attr => attr && attr.length ? attr[0] : undefined;

    const geom = [];
    result.gpx.wpt.forEach(wpt => {

      geom.push({
        geom: fromWKT(`POINT (${wpt.$.lon} ${wpt.$.lat})`, srcSRS),
        ele: wpt.ele ? parseFloat(wpt.ele) : undefined,
        time: getAttr(wpt.time),
        name: getAttr(wpt.name),
        desc: getAttr(wpt.desc),
        type: getAttr(wpt.type),
        cmt: getAttr(wpt.cmt),
        sym: getAttr(wpt.sym)
      });
    });
    resolve(geom);
  });
});

const toGPX = (geom) => new Promise((resolve) => {

  const isoTime = new Date().toISOString();
  const gpx = builder.create('gpx', {version: '1.0', encoding: 'UTF-8', standalone: null})
    .att('creator', 'gpxtools.js')
    .att('version', '1.1')
    .att('xsi:schemaLocation', 'http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd')
    .att('xmlns', 'http://www.topografix.com/GPX/1/1')
    .att('xmlns:xsi', 'http://www.w3.org/2001/XMLSchema-instance')
    .ele('metadata')
      .ele('link', { 'href': 'https://cmack.org/' })
        .ele('text', 'Charlie Mack').up()
      .up()
      .ele('time', isoTime).up()
    .up();

  geom.filter(g => g.geom.name == 'POINT').forEach(g => {
    const wpt = builder.create('wpt')
      .att('lat', g.geom.y.toFixed(8))
      .att('lon', g.geom.x.toFixed(8));
      if (g.ele !== undefined) wpt.ele('ele', g.ele.toFixed(4)).up();
      if (g.time !== undefined) wpt.ele('time', g.time.toISOString()).up();
      if (g.name !== undefined) wpt.ele('name', g.name).up();
      wpt.ele('cmt', g.cmt || g.desc || 'WAYPOINT').up();
      wpt.ele('desc', g.desc || g.cmt || 'WAYPOINT').up();
      if (g.sym !== undefined) wpt.ele('sym', g.sym).up();
    gpx.importDocument(wpt);
  });

  resolve(gpx.end({pretty: true, indent: '  ', newline: '\n'}));
});

module.exports = {parseGPX: parseGPX, toGPX: toGPX};

// <?xml version="1.0" encoding="utf-8" standalone="no"?>
// <gpx creator="gpxtools.js" version="1.1"
//   xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd
//   xmlns="http://www.topografix.com/GPX/1/1"
//   xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" >
//   <metadata>
//     <link href="https://cmack.org/">
//       <text>Charlie Mack</text>
//     </link>
//     <time>2015-04-27T23:09:11Z</time>
// </metadata>
//   <wpt lat="41.097316" lon="-123.696170">
//     <ele>107.753052</ele>
//     <time>2015-04-27T23:33:44Z</time>
//     <name>4501</name>
//     <cmt>SW212</cmt>
//     <desc>SW212</desc>
//     <sym>Waypoint</sym>
//   </wpt>
//   <trk>
//     <name>Current Track: 22 APR 2015 06:41</name>
//     <extensions>
//       <gpxx:TrackExtension>
//         <gpxx:DisplayColor>DarkYellow</gpxx:DisplayColor>
//       </gpxx:TrackExtension>
//     </extensions>
//     <trkseg>
//       <trkpt lat="40.63186" lon="-123.775465">
//         <ele>678.350000</ele>
//         <time>2015-04-22T14:41:01Z</time>
//       </trkpt>
//       <trkpt lat="40.631761" lon="-123.775524">
//         <ele>671.140000</ele>
//         <time>2015-04-22T14:41:55Z</time>
//       </trkpt>
//     </trkseg>
//   </trk>
//   <rte>
//     <name>ROAD-01</name>
//     <rtept lat="41.097316" lon="-123.696170">
//       <name>ROAD-01-001</name>
//     </rtept>
//     <rtept lat="41.123456" lon="-123.789012">
//       <name>ROAD-01-002</name>
//     </rtept>
//   </rte>
// </gpx>
