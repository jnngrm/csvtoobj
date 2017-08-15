'use strict';
const csvtoobj = require('./index');
const config = require(process.argv[2]);

function counts(config, objects) {
  let success = 0;
  let fail = 0;
  for (let object of objects) {
    if (object.failures.length === 0) {
      success++;
    } else {
      fail++;
    }
  }
  console.log(`COUNTS:
    success: ${success}
    fail: ${fail}
    unmatched: ${config.unmatched ? config.unmatched.length : 0}`);
}

function mostSeenFailures(objects) {
  console.log(`MOST SEEN FAILURES:`);
  let seen = {};
  for (let object of objects) {
    for (let failure of object.failures) {
      let type = failure.match(/(.*)=.*/)[1];
      seen[type] = seen[type] ? seen[type] + 1 : 1;
    }
  }
  let sortable = [];
  for (let type of Object.keys(seen)) {
    sortable.push({type: type, count: seen[type]});
    sortable.sort(function(a, b) {
      return b.count - a.count;
    });
  }
  for (let entry of sortable) {
    console.log(`  ${entry.type}: ${entry.count}`);
  }
}

function printFailed(objects) {
  console.log(`FAILED OBJECTS:`);
  for (let object of objects) {
    if (object.failures.length > 0) {
      console.log(`  ${JSON.stringify(object, null, 2)}`);
    }
  }
}

function printUnmatched(config) {
  console.log(`UNMATCHED IDS:
    ${JSON.stringify(config.unmatched)}`);
}

csvtoobj(config, function(error, objects) {
  if (error) {
    console.error(error);
  } else {
    counts(config, objects);
    mostSeenFailures(objects);
    printFailed(objects);
    printUnmatched(config);
  }
});
