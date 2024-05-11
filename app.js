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

const { execSync } = require('child_process');
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
  res.send("hello tsl. go to /tslsynth to make a request");
});

// [START cloudrun_system_package_handler]
// [START run_system_package_handler]
app.post('/tslsynth', function (req, res) {
  var tsl = req.body.tsl;
  var target = req.body.target;
  var user = req.body.user;

  try {
    const synthResult = createDiagram(tsl, target);
    logSpec(req, synthResult.toString());

    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(synthResult);
  } catch (err) {
    console.error(`error: ${err.message}`);
    const errDetails = (err.stderr || err.message).toString();
    if (errDetails.includes('syntax')) {
      res.status(400).send(`Bad Request: ${err.message}`);
    } else {
      res.status(500).send(err.message);
    }
  }
});

app.post('/tslminrealizable', (req, res) => {
  console.log("User ID:")
  console.log(req.body.user);

  try {
    const synthResult = createMinDiagram(req.body.tsl);

    logSpec(req, synthResult.toString());

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
    fs.writeFileSync('/usr/src/app/tsltools/tmp.tsl', tsl)
  } catch (err) {
    console.error(err)
  }

  const synthResult = execSync(`tsl synthesize -i tmp.tsl --` + target, {
    cwd: "/usr/src/app/tsltools",
    input: tsl,
  });

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

  return synthResult;
};

// [END run_system_package_exec]
// [END cloudrun_system_package_exec]

module.exports = app;

function logSpec(req, synthResult) {
  var tsl = req.body.tsl;
  var target = req.body.target;
  var user = req.body.user;
  var logEnabled = req.body.logEnabled;

  console.log(logEnabled);

  const project = 'tslapi-2';

  // Build structured log messages as an object.
  const globalLogFields = {};

  // Add log correlation to nest all log messages beneath request log in Log Viewer.
  // (This only works for HTTP-based invocations where `req` is defined.)
  if (typeof req !== 'undefined') {
    const traceHeader = req.header('X-Cloud-Trace-Context');
    if (traceHeader && project) {
      const [trace] = traceHeader.split('/');
      globalLogFields['logging.googleapis.com/trace'] =
        `projects/${project}/traces/${trace}`;
    }
  }

  // Complete a structured log entry.
  const entry = Object.assign(
    {
      severity: 'NOTICE',
      message: 'Logging TSL spec.',
      // Log viewer accesses 'component' as 'jsonPayload.component'.
      spec: tsl,
      userId: user,
      target: target,
      synthResult: synthResult,
      //license: "https://creativecommons.org/licenses/by-nc/4.0/" Don't need this in private logs, just in public repo
    },
    globalLogFields
  );

  // Serialize to a JSON string and output.
  if (logEnabled === 'true') {
    console.log(JSON.stringify(entry));
  }
}
