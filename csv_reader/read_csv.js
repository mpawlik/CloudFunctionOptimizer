const Promise = require('bluebird');
const fs = require('fs');
const parse = require('csv-parse');

const executionData = 'grafana_data_export.csv';
const pricingData = 'gcf_pricing.csv';

let parseFile = function (file) {
  return new Promise(function (resolve, reject) {
    let parser = parse({delimiter: ';', from: 2},
      function (err, data) {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
        parser.end();
      });
    fs.createReadStream(file).pipe(parser);
  })
};

let parsedTimes = parseFile(executionData)
  .then(data => {
    let times = {"1024": 0, "128": 0, "2048": 0, "256": 0, "512": 0};
    let count = 0;

    data.forEach(function (line) {
      if (!(line.indexOf("undefined") > -1)) {
        times["1024"] += parseFloat(line[1]);
        times["128"] += parseFloat(line[2]);
        times["2048"] += parseFloat(line[3]);
        times["256"] += parseFloat(line[4]);
        times["512"] += parseFloat(line[5]);
        count++;
      }
    });

    return {
      "128": times["128"] / count,
      "256": times["256"] / count,
      "512": times["512"] / count,
      "1024": times["1024"] / count,
      "2048": times["2048"] / count
    };
  });

let parsePrices = parseFile(pricingData)
  .then(data => {
    let price = {};
    data.forEach(function (line) {
      price[line[0]] = line[1];
    });
    return price;
  });

parsedTimes.then(mean_times => {
  parsePrices.then(prices => {
    let performance = {
      "128": 1 / mean_times["128"],
      "256": 1 / mean_times["256"],
      "512": 1 / mean_times["512"],
      "1024": 1 / mean_times["1024"],
      "2048": 1 / mean_times["2048"]
    };
    console.log(performance);

    let cost_per_unit = {
      "128": performance["128"] * prices["128"],
      "256": performance["256"] * prices["256"],
      "512": performance["512"] * prices["512"],
      "1024": performance["1024"] * prices["1024"],
      "2048": performance["2048"] * prices["2048"]
    };
    console.log(cost_per_unit);
  })
});

