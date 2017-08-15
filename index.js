'use strict';
const csv = require('csvtojson');
const async = require('async');
const _ = require('lodash');
const validator = require('validator');

function parseCsvs(config, next) {
  async.each(config.csvFiles, function(file, callback) {
    file.records = {};
    csv().fromFile(file.name).on('json', function(obj) {
      file.records[obj[file.id]] = obj;
    }).on('done', callback);
  }, next);
}

function buildObject(config, id) {
  let root = {
    id
  };
  for (let objectName of Object.keys(config.objects)) {
    root[objectName] = root[objectName] || {};
    for (let propertyKey of Object.keys(config.objects[objectName])) {
      let property = config.objects[objectName][propertyKey];
      let record = config.csvFiles[property.alias].records[id];
      if (record) {
        root[objectName][propertyKey] =
          _.get(record, property.name, property.default) || property.default;
      }
    }
  }
  return root;
}

function buildObjects(config) {
  let objects = [];
  let master = config.csvFiles[config.general.masterCsv];
  for (let id of Object.keys(master.records)) {
    objects.push(buildObject(config, id));
  }
  return objects;
}

function validateObjects(config, objects) {
  for (let object of objects) {
    object.failures = [];
    for (let objectName of Object.keys(config.objects)) {
      for (let propertyKey of Object.keys(config.objects[objectName])) {
        let property = config.objects[objectName][propertyKey];
        if (property.rules) {
          for (let rule of property.rules) {
            let value = object[objectName][propertyKey] || '';
            let args = rule.args || [];
            let valid = validator[rule.def](value, ...args);
            if (!valid) {
              object.failures.push(
              `${objectName}.${propertyKey}=${value} (${rule.def}: ${valid})`);
            }
          }
        }
      }
    }
  }
}

module.exports = function(config, next) {
  parseCsvs(config, function(error, result) {
    if (error) {
      next(error);
    } else {
      let objects = buildObjects(config);
      validateObjects(config, objects);
      next(null, objects);
    }
  });
};