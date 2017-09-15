
function decorate(dag, propertyName) {
    if(!dag.tasks){
        throw new Error("DAG file doesn't contain tasks within.")
    }
    dag.tasks.forEach(task => {
        task[propertyName]= "dodane";
        // TODO Implement deployment type logic
    });
}
exports.decorate = decorate;