#!/usr/bin/env bash

scriptdir=`dirname "$0"`
appdir=`dirname "${scriptdir}"`

inputDir=$1
outputFolder=$2
inputFiles=${inputDir}/*

normalizedLogs="./results-request-duration/montage/sdbcs_x5/step1/montage_AWS_256_512_1024_1536_2048_2560_3008x5/normalized_logs.csv"


parser=${appdir}/dagscripts/test_workflows/avereage_request_times_decorator.js

mkdir -p ${outputFolder}

for f in ${inputFiles}
do
    file="$(basename -- $f)"
    outputFile=${outputFolder}/${file}
    echo "Parsing file: $file"
    echo node ${parser} ${f} ${normalizedLogs} ${outputFile}
#    node ${parser} ${f} ${normalizedLogs} ${outputFile}
done