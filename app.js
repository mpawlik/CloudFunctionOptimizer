const config = require('./configuration/config');
const decorator = require('./decorator/decorator');

console.log("Starting Application");
console.log("Configuration " + JSON.stringify(config));

decorator.decorate(config.path, config.propertyName);