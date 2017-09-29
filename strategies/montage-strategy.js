function montageDecorateStrategy(tasks) {
    tasks.forEach(task => {
        task.property = task.name;
    })
}

module.exports = montageDecorateStrategy;