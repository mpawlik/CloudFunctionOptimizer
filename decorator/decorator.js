const fs = require('fs');

function decorate(path, propertyName) {
    fs.readFile(path, (err, data) => {
        if (err) {
            console.error("Error while reading a file");
            throw err;
        }
        let dag = JSON.parse(data);
        addPropertyToDAG(dag, propertyName);
    });
}

function addPropertyToDAG(dag, propertyName) {
    dag.tasks.forEach(task => {
        task[propertyName]= "dodane";
        // TODO Implement deployment type logic
    });
}

exports.decorate = decorate;