const Promise = require('bluebird');
const fs = Promise.promisifyAll(require('fs'));
const config = require('./configuration/config');
const decorator = require('./decorator/decorator');

console.log("Starting Application");
console.log("Configuration " + JSON.stringify(config));

// read dag file
let decoratePromise = fs.readFileAsync(config.path)
    .then(data => {
        let dag = JSON.parse(data);
        decorator.decorate(dag, config.propertyName);
        return dag;
    });

//save decorated file
decoratePromise
    .then(dag => {
        let path = config.resultPath;
        let objectToSave = JSON.stringify(dag, null, 2);
        return fs.writeFileAsync(path, objectToSave);
    })
    .then(() => console.log("Saved decorated DAG file as " + config.resultPath))
    .catch(console.error);
