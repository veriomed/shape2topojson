var path = require('path');
var fs = require('fs');
var http = require('http');
var shpjs = require('shpjs');
var topojson = require('topojson');
var async = require('async');

http.createServer(function (req, res) {
	if(req.url.startsWith("/shapefiles/")){
		var filePath = path.join(__dirname, "./../ZCTA_BY_USA_STATES/", decodeURI(req.url).replace("/shapefiles/",""));
		var stat = fs.statSync(filePath);

		res.writeHead(200, {
			'Content-Type': 'application/zip',
			'Content-Length': stat.size
		});

		var readStream = fs.createReadStream(filePath);
		readStream.pipe(res);
	}else{
		res.write('TIGER Shape (.shp) File to TopoJSON convertor');
		res.end();		
	}
}).listen(9383);


fs.readdir("./../ZCTA_BY_USA_STATES/", function(err, files) {
		async.eachLimit(files, 10, function(file, callback) {
			if(file.endsWith(".zip")){
				console.log("Processing file " + file);
				shpjs(('http://localhost:9383/shapefiles/' + file)).then(function(geojson){
					 var mTopoJSON = topojson.topology({ geo: geojson }, {
						'verbose': false,
						'pre-quantization': 1000000,
						'post-quantization': 10000,
						'coordinate-system': 'auto',
						'stitch-poles': true,
						'minimum-area': 0,
						'preserve-attached': true,
						'retain-proportion': 0,
						'force-clockwise': false,
						'property-transform': function (feature) {
						  return feature.properties;
						}
					 });
					 var mTopoJSONStr = JSON.stringify(mTopoJSON);
					 fs.writeFile(path.resolve('./topojson-raw-output/' + file.replace('.zip', '') + '.topojson'), mTopoJSONStr, function (err) {
						fs.writeFile(path.resolve('./topojson-js-output/' + file.replace('.zip', '') + '.topojson.js'), "var gZIPTopoJSON=" + mTopoJSONStr, function (err){
							callback(err || null);
						});
					 });
				});
			}else{
				callback();
			}
		}, function(err) {
			 if( err ) {
				console.log('A file failed to process');
			 } else {
				console.log('All files have been processed successfully');
			 }
			 process.exit(0);
		});
});





