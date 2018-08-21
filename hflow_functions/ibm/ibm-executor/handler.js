const spawn = require('child_process').spawn;
const fs = require('fs');
const async = require('async');
const IBM = require('ibm-cos-sdk');
const cos = new IBM.S3({
    "apiKeyId": "xxx",
    "endpoint": "xxx",
    "serviceInstanceId": "xxx"
});

module.exports.executor = function (params) {

    const executable = params.executable;
    const args = params.args;
    const inputs = params.inputs;
    const outputs = params.outputs;
    const bucket_name = params.options.bucket;

    const t_start = Date.now();
    let t_end;

    console.log('executable: ' + executable);
    console.log('args:       ' + args);
    console.log('inputs:     ' + JSON.stringify(inputs));
    console.log('inputs[0].name:     ' + inputs[0].name);
    console.log('outputs:    ' + JSON.stringify(outputs));
    console.log('bucket:     ' + bucket_name);

    function download(callback) {
        async.each(inputs, function (file, callback) {

            const file_name = file.name;
            console.log('downloading ' + bucket_name + "/" + file_name);

            const params = {
                Bucket: bucket_name,
                Key: file_name
            };

            cos.getObject(params, function (err, data) {
                if (err) {
                    console.log("Error downloading file " + JSON.stringify(params));
                    console.log(err);
                    callback(err);
                } else {
                    fs.writeFile('/tmp/' + file_name, data.Body, function (err) {
                        if (err) {
                            console.log("Unable to save file " + file_name);
                            callback(err);
                        }
                        console.log("Downloaded file " + JSON.stringify(params));
                        callback();
                    });
                }
            });
        }, function (err) {
            if (err) {
                console.error('A file failed to process');
                callback('Error downloading')
            } else {
                console.log('All files have been downloaded successfully');
                callback()
            }
        });
    }

    function execute(callback) {
        const proc_name = __dirname + '/' + executable;

        console.log('spawning ' + proc_name);
        process.env.PATH = '.:' + __dirname; // add . and __dirname to PATH since e.g. in Montage mDiffFit calls external executables
        const proc = spawn(proc_name, args, {cwd: '/tmp'});

        proc.on('error', function (code) {
            console.error('error!!' + executable + JSON.stringify(code));
        });

        proc.stdout.on('data', function (exedata) {
            console.log('Stdout: ' + executable + exedata);
        });

        proc.stderr.on('data', function (exedata) {
            console.log('Stderr: ' + executable + exedata);
        });

        proc.on('close', function (code) {
            console.log('My exe close' + executable);
            callback()
        });

        proc.on('exit', function (code) {
            console.log('My exe exit' + executable);
        });

    }

    function upload(callback) {
        async.each(outputs, function (file, callback) {

            const file_name = file.name;
            console.log('uploading ' + bucket_name + "/" + file_name);

            fs.readFile('/tmp/' + file_name, function (err, data) {
                if (err) {
                    console.log("Error reading file " + file_name);
                    console.log(err);
                    callback(err);
                }

                const params = {
                    Bucket: bucket_name,
                    Key: file_name,
                    Body: data
                };

                cos.putObject(params, function (err, data) {
                    if (err) {
                        console.log("Error uploading file " + file_name);
                        console.log(err);
                        callback(err);
                    }
                    console.log("Uploaded file " + file_name);
                    callback();
                });
            });

        }, function (err) {
            if (err) {
                console.error('A file failed to process');
                callback('Error uploading')
            } else {
                console.log('All files have been uploaded successfully');
                callback()
            }
        });
    }

    return new Promise((resolve, reject) => {

        async.waterfall([
            download,
            execute,
            upload
        ], function (err, result) {
            if (err) {
                console.error('Error: ' + err);
                const response = {
                    statusCode: 400,
                    body: JSON.stringify({
                        message: 'Bad Request: ' + JSON.stringify(err)
                    })
                };

                reject(response) ;
            } else {
                console.log('Success');
                t_end = Date.now();
                const duration = t_end - t_start;

                const response = {
                    statusCode: 200,
                    body: JSON.stringify({
                        message: 'IBM OpenWhisk exit: start ' + t_start + ' end ' + t_end + ' duration ' + duration + ' ms, executable: ' + executable + ' args: ' + args
                    })
                };

                resolve(response);
            }
        });
    });
};