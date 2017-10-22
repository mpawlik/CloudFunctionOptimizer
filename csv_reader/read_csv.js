var fs = require('fs');
var parse = require('csv-parse');
 
var executionData = 'grafana_data_export.csv';
var pricingData = 'gcf_pricing.csv';

var isComplete = function(line) {
	return !(line.indexOf("undefined") > -1)
}

var times_parser = parse({delimiter: ';', from: 2}, function (err, data) {
 		var times = { "1024": 0, "128": 0, "2048": 0, "256": 0, "512": 0 }
		var count = 0;    

		data.forEach(function(line) {
			if (isComplete(line)) {
				times["1024"] += parseFloat(line[1])
				times["128"] += parseFloat(line[2])
				times["2048"] += parseFloat(line[3])
				times["256"] += parseFloat(line[4])
				times["512"] += parseFloat(line[5])
				count++;
			}
    });    
		var mean_times = { 
			"128": times["128"]/count,
			"256": times["256"]/count,
			"512": times["512"]/count,
			"1024": times["1024"]/count,
			"2048": times["2048"]/count
 		}
		console.log(mean_times);
});
 

var pricing_parser = parse({delimiter: ';', from: 2}, function (err, data) {
		var price = {};
		data.forEach(function(line) {
			price[line[0]] = line[1];
		});
		console.log(price);
});

fs.createReadStream(executionData).pipe(times_parser);
fs.createReadStream(pricingData).pipe(pricing_parser);

