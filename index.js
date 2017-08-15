'use strict';
const csv = require('csvtojson');
const async = require('async');
const _ = require('lodash');
const countries = require('country-data').countries;
const ruleLibs = {
  validator: require('validator'),
  countries: {
    valid: function(code) {
      return countries[code];
    }
  }
};


function parseCsvs(config, next) {
  async.each(config.csvFiles, function(file, callback) {
    file.records = {};
    csv().fromFile(`${_dir}/${file.name}`).on('json', function(obj) {
      file.records[obj[file.id]] = obj;
    }).on('done', callback);
  }, next);
}

function buildObject(config, id) {
  let root = {
    id,
    failures: []
  };
  for (let objectName of Object.keys(config.objects)) {
    root[objectName] = root[objectName] || {};
    for (let propertyKey of Object.keys(config.objects[objectName])) {
      let property = config.objects[objectName][propertyKey];
      let record = config.csvFiles[property.alias].records[id];
      if (record) {
        root[objectName][propertyKey] =
          _.get(record, property.name, property.default) || property.default;
      } else {
        config.unmatched = config.unmatched || [];
        config.unmatched.push(id);
        if (config.general.requireMatchingId) {
          return null;
        }
        root.failures.push(
          `${objectName}.${propertyKey}= (NO id:${id} in ${property.alias})`);
      }
    }
  }
  return root;
}

function buildObjects(config) {
  let objects = [];
  let master = config.csvFiles[config.general.masterCsv];
  for (let id of Object.keys(master.records)) {
    let object = buildObject(config, id);
    if (object) {
      objects.push(buildObject(config, id));
    }
  }
  return objects;
}

function validateObjects(config, objects) {
  for (let object of objects) {
    for (let objectName of Object.keys(config.objects)) {
      for (let propertyKey of Object.keys(config.objects[objectName])) {
        let property = config.objects[objectName][propertyKey];
        if (property.rules) {
          for (let rule of property.rules) {
            let value = object[objectName][propertyKey] || '';
            let args = rule.args || [];
            let lib = ruleLibs[rule.lib] || ruleLibs.validator;
            let valid = lib[rule.def](value, ...args);
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
