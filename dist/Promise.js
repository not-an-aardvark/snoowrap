'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var PromiseCopy = _bluebird2.default.getNewLibraryCopy();
PromiseCopy.config({ cancellation: true, warnings: false });
exports.default = PromiseCopy;