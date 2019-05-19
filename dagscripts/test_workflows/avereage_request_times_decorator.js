const fs = require('fs');
const path = require('path');
const csvParser = require('fast-csv');

const realStartTimesString = "realStartTime";
const realFinishTimesString = "realFinishTime";

const startTimesString = "startTime";
const finishTimesString = "finishTime";

const saveToFile = true;

const dagPath = process.argv[2];
const csvPath = process.argv[3];
const outputPath = process.argv[4];
const outputCSV = process.argv[5];

const functionSizes = [256, 512, 1024, 1536, 2048, 2560, 3008];

if(!csvPath || !dagPath || !outputPath || (saveToFile && !outputCSV)){
  throw new Error("Provide valid arguments: node time-decorator.js DAG_PATH CSV_PATH OUTPUT_PATH (OUTPUT_CSV)");
}

console.log(`Input  DAG file path is ${dagPath}`);
console.log(`Input  CSV file path is ${csvPath}`);
console.log(`Output DAG file path is ${outputPath}`);
console.log(`Output CSV file path is ${outputCSV}`);

let dag = fs.readFileSync(dagPath);
dag = JSON.parse(dag);

if(!dag.tasks) throw new Error("There are no tasks in dag file");

let tasks = dag.tasks;

let idTypeMap = new Map();


csvParser
  .fromPath(csvPath, {delimiter: ' ', headers: true})
  .on("data", data => {
    // Setting times from normalized logs

    // Average by task id
    // Setting times from normalized logs
    // if(!idTypeMap.has(data.id)) idTypeMap.set(data.id, new Map());
    // let typeTimeMap = idTypeMap.get(data.id);

    // Average by task
    if(!idTypeMap.has(data.task)) idTypeMap.set(data.task, new Map());
    let typeTimeMap = idTypeMap.get(data.task);

    if(!typeTimeMap.get(data.type)) typeTimeMap.set(data.type, []);
    typeTimeMap.get(data.type).push(
      {
        startTime: Number(data.request_start),
        finishTime: Number(data.request_end),
        downloadedTime: Number(data.downloaded),
        executedTime: Number(data.request_duration),
        uploadedTime: Number(data.uploaded)
      }
    );
  })
  .on("end", function () {
    let resourceTimes = calculateResourceTimes(idTypeMap);

    decorateTaskWithTime(tasks, resourceTimes);
    fs.writeFile(outputPath, JSON.stringify(dag, null, 2), (err) => { if (err) throw err; });
  });

function calculateResourceTimes(idTimeMap) {
  let startTimes = {};
  let finishTimes = {};
  let downloadedTimes = {};
  let executedTimes = {};
  let uploadedTimes = {};

  if(saveToFile) {
    fs.writeFileSync(outputCSV, "task type start end downloaded executed uploaded\n", console.err);
  }
  for(let task of idTimeMap.keys()){
    let typeTimeMap = idTimeMap.get(task);
    for(let type of typeTimeMap.keys()){
      let timestamps = typeTimeMap.get(type);
      let average = calculateAverage(timestamps);

      if (!startTimes[task]) startTimes[task] = {};
      if (!finishTimes[task]) finishTimes[task] = {};
      if (!downloadedTimes[task]) downloadedTimes[task] = {};
      if (!executedTimes[task]) executedTimes[task] = {};
      if (!uploadedTimes[task]) uploadedTimes[task] = {};

      startTimes[task][type] = average.startTime;
      finishTimes[task][type] = average.finishTime;
      downloadedTimes[task][type] = average.downloadedTime;
      executedTimes[task][type] = average.executedTime;
      uploadedTimes[task][type] = average.uploadedTime;
      if(saveToFile) {
        fs.appendFileSync(outputCSV,`${task} ${type} ${average.startTime} ${average.finishTime} ${average.downloadedTime} ${average.executedTime} ${average.uploadedTime}\n`);
      }
    }
  }
  return { startTimes, finishTimes, downloadedTimes, executedTimes, uploadedTimes };
}

function calculateAverage(times) {

  let startSum = 0;
  let finishSum = 0;
  let downloadedSum = 0;
  let executedSum = 0;
  let uploadedSum = 0;

  for(let i=0; i< times.length; i++){
    startSum += times[i].startTime;
    finishSum += times[i].finishTime;
    downloadedSum += times[i].downloadedTime;
    executedSum += times[i].executedTime;
    uploadedSum += times[i].uploadedTime;
  }
  return {
    startTime: Math.round(startSum / times.length),
    finishTime: Math.round(finishSum / times.length),
    downloadedTime: Math.round(downloadedSum / times.length),
    executedTime: Math.round(executedSum / times.length),
    uploadedTime: Math.round(uploadedSum / times.length),
  };
}

function calculateExecutionTimes(realStartTimes, realFinishTimes, syntheticTime) {
  let output = {};

  functionSizes.forEach( functionSize => {
    const startTime = realStartTimes[functionSize];
    const finishTime = realFinishTimes[functionSize];
    const duration = finishTime - startTime;

    const baseStartTime = realStartTimes['256'];
    const baseFinishTime = realFinishTimes['256'];
    const baseDuration = baseFinishTime - baseStartTime;

    output[functionSize] = Math.round(syntheticTime * duration/baseDuration);
  });

  return output;
}

function generateStartTimes() {
  let output = {};

  functionSizes.forEach( functionSize => {
    output[functionSize] = 0;
  });

  return output;
}

function decorateTaskWithTime(tasks, times) {
  tasks.forEach(task => {
    let taskType = task.name;

    // test workflows captialize mImgTbl this way
    if (taskType == "mImgTbl") {
      taskType = "mImgtbl";
    }

    let realStartTimes = times.startTimes[taskType];
    let realFinishTimes = times.finishTimes[taskType];

    if (realStartTimes == undefined || realFinishTimes == undefined) {
      console.log("Warning! Unknown type of task: " + taskType);
    }

    task[realStartTimesString] = {...task[realStartTimesString], ...realStartTimes};
    task[realFinishTimesString] = {...task[realFinishTimesString], ...realFinishTimes};

    //convert s -> ms
    let syntheticRuntime = task.config.synthetic_runtime * 1000;
    task[startTimesString] = generateStartTimes();
    task[finishTimesString] = calculateExecutionTimes(realStartTimes, realFinishTimes, syntheticRuntime);
  })
}
