// Copyright 2019 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

const {execSync} = require('child_process');
const fs = require('fs');

const express = require('express');
const app = express();

var cors = require('cors');
app.use(cors());

app.use(require('body-parser').urlencoded({ extended: false }));

// Verify the the dot utility is available at startup
// instead of waiting for a first request.
//fs.accessSync('/usr/bin/dot', fs.constants.X_OK);

app.get('/', (req, res) => {
    res.send("hello tsl");
});

// [START cloudrun_system_package_handler]
// [START run_system_package_handler]
app.post('/tslsynth', function(req, res){
  var tsl = req.body.tsl;
  var target = req.body.target;
  var user = req.body.user;

  console.log("User ID:")
  console.log(user);

  console.log("tslSpec:");
  console.log(tsl);

  console.log("target:")
  console.log(target);

  try {
    const synthResult = createDiagram(tsl, target);
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(synthResult);
  } catch (err) {
    console.error(`error: ${err.message}`);
    const errDetails = (err.stderr || err.message).toString();
    if (errDetails.includes('syntax')) {
      res.status(400).send(`Bad Request: ${err.message}`);
    } else {
      res.status(500).send('Internal Server Error');
    }
  }
});

app.post('/tslminrealizable', (req, res) => {
  console.log("User ID:")
  console.log(req.body.user);

  try {
    const synthResult = createMinDiagram(req.body.tsl);

    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(synthResult);
  } catch (err) {
    console.error(`error: ${err.message}`);
    const errDetails = (err.stderr || err.message).toString();
    if (errDetails.includes('syntax')) {
      res.status(400).send(`Bad Request: ${err.message}`);
    } else {
      res.status(500).send('Internal Server Error');
    }
  }
});
// [END run_system_package_handler]
// [END cloudrun_system_package_handler]

// [START cloudrun_system_package_exec]
// [START run_system_package_exec]
// Generate a diagram based on a graphviz DOT diagram description.
const createDiagram = (tsl, target) => {
  if (!tsl) {
    throw new Error('syntax: no tsl spec provided');
  }
  if (!target) {
    target = "js"
  }
  try {
  fs.writeFileSync('tsltools/tmp.tsl', tsl)
  } catch (err) {
    console.error(err)
  }
 
  const synthResult = execSync(`./tslsynth tmp.tsl --`+target, {
    cwd: "./tsltools",
    input: tsl,
  });

  console.log("synthResult:");
  console.log(String(synthResult));

  return synthResult;
};

const createMinDiagram = (tsl) => {
  if (!tsl) {
    throw new Error('syntax: no tsl spec provided');
  }
  try {
    fs.writeFileSync('tsltools/tmp.tsl', tsl)
  } catch (err) {
    console.error(err)
  }

  const synthResult = execSync(`./tslminrealizable tmp.tsl -r /usr/src/app/tsltools/tlsfSynth_stdin.sh`, {
    cwd: "./tsltools",
    input: tsl,
  });
  console.log("synthResult");
  console.log(String(synthResult));
  return synthResult;
};

// [END run_system_package_exec]
// [END cloudrun_system_package_exec]

module.exports = app;
