#!/usr/bin/env bash

# usage: script.sh config_template.json dag_input_dir dag_output_dir
# usage: ./scripts/schedule_test_package.sh configuration/test_package/config_test_package.json.template tests/montage_test_package_decorated/ tests/montage_test_package_scheduled/

scriptdir=`dirname "$0"`
appdir=`dirname "${scriptdir}"`
schedulingDecorator=${appdir}/app.js

configTemplatePath=$1
configTemplate=${appdir}/${configTemplatePath}

inputDAGDir=$2
outputDAGDir=$3

BUDGET="0.5"
DEADLINE="0.5"
ALGORITHM="sdbws"

for dag in ${appdir}/${inputDAGDir}/*
do
    baseFileName=$(basename -s .json ${dag})
    outputDAG=${appdir}/${outputDAGDir}/${baseFileName}.${ALGORITHM}.scheduled.json
    config=${appdir}/${outputDAGDir}/configs/${baseFileName}.${ALGORITHM}.config.json
    mkdir -p ${appdir}/${outputDAGDir}/configs/

    echo "Processing ${baseFileName}"

    # prepare config for given dag

    cp ${configTemplate} ${config}
    sed -e "s/BUDGET/${BUDGET}/" -i "" ${config}
    sed -e "s/DEADLINE/${DEADLINE}/" -i "" ${config}
    sed -e "s/ALGORITHM/${ALGORITHM}/" -i "" ${config}

    echo "Scheduling DAG: ${dag}"
    node ${schedulingDecorator} ${dag} ${outputDAG} ${config}
    exit 1
done
