'use strict';
const csvtoobj = require('./index');
const config = require(process.argv[2]);

function counts(objects) {
  let success = 0;
  let fail = 0;
  for (let object of objects) {
    if (object.failures.length === 0) {
      success++;
    } else {
      fail++;
    }
  }
  console.log(`success: ${success} fail: ${fail}`);
}

function mostSeenFailures(objects) {
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
    console.log(`${entry.type}: ${entry.count}`);
  }
}

csvtoobj(config, function(error, objects) {
  if (error) {
    console.error(error);
  } else {
    counts(objects);
    mostSeenFailures(objects);
  }
});
