# csvtoobj
Validate and translate one or more CSVs to JSON.  Uses JSON configuration file to define mapping between CSVs and object and supports basic validation of CSV data.

# installation
 $ npm install --save csvtoobj

# configuration

```json
{
  "general": {
    "masterCsv": "masterCsv",
    "requireMatchingId": true
  },
  "csvFiles": {
    "masterCsv": {
      "name": "master.csv",
      "id": "id"
    },
    "anotherCsv": {
      "name": "another.csv",
      "id": "Processor Transaction ID"
    }
  },
  "objects": {
    "recurring": {
      "currency": {
        "alias": "masterCsv",
        "name": "currency",
        "default": "USD",
        "rules": [
          {
            "def": "isIn",
            "args": [
              ["USD"]
            ]
          }
        ]
      },
      "amount": {
        "alias": "slaveCsv",
        "name": "Amount Per Period",
        "rules": [
          {"def": "isCurrency"}
        ]
      },
      "recurringUnit": {
        "alias": "slaveCsv",
        "name": "Frequency",
        "rules": [
          {
            "def": "isIn",
            "args": [
              ["MONTHLY"]
            ]
          }
        ]
      },
      "recurOn": {
        "alias": "slaveCsv",
        "name": "Monthly Payment Day",
        "rules": [
          {
            "def": "isInt",
            "args": [
              {
                "min": 1,
                "max": 28
              }
            ]
          }
        ]
      }
    },
    "paymentToken": {
      "firstName": {
        "alias": "slaveCsv",
        "name": "First Name",
        "rules": [
          {
            "def": "isByteLength",
            "args": [
              {
                "min": 1
              }
            ]
          }
        ]
      },
      "lastName": {
        "alias": "slaveCsv",
        "name": "Last Name",
        "rules": [
          {
            "def": "isByteLength",
            "args": [
              {
                "min": 1
              }
            ]
          }
        ]
      },
      "email": {
        "alias": "slaveCsv",
        "name": "Billing Email",
        "rules": [
          {"def": "isEmail"}
        ]
      },
      "address1": {
        "alias": "masterCsv",
        "name": "credit_card.billing_address.street_address",
        "rules": [
          {
            "def": "isByteLength",
            "args": [
              {
                "min": 1
              }
            ]
          }
        ]
      },
      "address2": {
        "alias": "masterCsv",
        "name": "credit_card.billing_address.extended_address"
      },
      "city": {
        "alias": "slaveCsv",
        "name": "Billing City",
        "rules": [
          {
            "def": "isByteLength",
            "args": [
              {
                "min": 1
              }
            ]
          }
        ]
      },
      "state": {
        "alias": "slaveCsv",
        "name": "Billing State",
        "rules": [
          {
            "def": "isByteLength",
            "args": [
              {
                "min": 1
              }
            ]
          }
        ]
      },
      "zip": {
        "alias": "slaveCsv",
        "name": "Billing Zip",
        "rules": [
          {
            "def": "isByteLength",
            "args": [
              {
                "min": 1
              }
            ]
          }
        ]
      },
      "country": {
        "alias": "slaveCsv",
        "name": "Address - Country",
        "rules": [
          {
            "lib": "countries",
            "def": "valid"
          }
        ]
      },
      "currency": {
        "alias": "masterCsv",
        "name": "currency",
        "default": "USD",
        "rules": [
          {
            "def": "isIn",
            "args": [
              ["USD"]
            ]
          }
        ]
      }
    }
  }
}
```

#usage

```javascript
const csvtoobj = require('csvtoobj');

csvtoobj(config, function(error, objects) {
  if (error) {
    console.log(error);
  } else {
    console.log(JSON.stringify(objects, null, 2));
  }
});
```

#options

**general**

* *masterCsv*: Which CSV will be used for master set of ids.
* *requireMatchingId*: If true, will not attempt to build objects where ID is not represented in all CSVs

**csvFiles**

* *csvFile*: The alias used to reference CSV in other parts of configuration.  Example above is masterCsv and slaveCsv.
..* *name*: The filename which can be used to read the file.
..* *id*: The ID that will associate the CSV row with other CSVs in this set.

**objects**

* *objectName*: The resulting name of the object in the root of returned object, examples above are recurring and paymentToken.
..* *objectProperty*: The name of a property associated with the object, examples above are recurring.firstName, recurring.lastName.
...* *alias*: Which CSV is associated with this property.
...* *name*: The column in the CSV associated with this property.
...* *default*: If not found or empty, the default value to use instead.
...* *rules*: Validation rules to run against property value.
....* *lib*: Which library to use for validation, see validation section below.
....* *def*: The function name which will be invoked on the lib.
....* *args*: Any args in addition to the already passed property value.

# validation

Currently supported libraries:

* validator (see https://www.npmjs.com/package/validator)
* countries (see https://www.npmjs.com/package/country-data)

If failures occur, the details will be appended to the object root under:

object.failures

Failures do not result in objects being removed from list, it is up to the caller to decide what to do if validation failures are present.
