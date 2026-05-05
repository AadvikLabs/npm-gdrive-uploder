"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateFileName = exports.getContentType = exports.GoogleDriveStorage = void 0;
var GoogleDriveStorage_1 = require("./GoogleDriveStorage");
Object.defineProperty(exports, "GoogleDriveStorage", { enumerable: true, get: function () { return GoogleDriveStorage_1.GoogleDriveStorage; } });
var content_type_1 = require("./utils/content-type");
Object.defineProperty(exports, "getContentType", { enumerable: true, get: function () { return content_type_1.getContentType; } });
Object.defineProperty(exports, "generateFileName", { enumerable: true, get: function () { return content_type_1.generateFileName; } });
