var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target, mod));

// src/index.ts
var import_mockjs = __toESM(require("mockjs"));
var import_fs = __toESM(require("fs"));
var import_path = __toESM(require("path"));
var import_assert = __toESM(require("assert"));
var import_body_parser = __toESM(require("body-parser"));
var import_chokidar = require("chokidar");
var import_path_to_regexp = require("path-to-regexp");
var OPTIONAL_METHODS = ["get", "post", "put", "patch", "delete"];
var BODY_METHODS = OPTIONAL_METHODS.filter((method) => method !== "get");
var rootDir = process.cwd();
var mockPath = import_path.default.resolve(rootDir, "mock");
function getMockFiles(mockPath2) {
  const mockFiles = import_fs.default.existsSync(mockPath2) ? import_fs.default.readdirSync(mockPath2) : [];
  return mockFiles.reduce((prev, cur) => {
    const curMockPath = import_path.default.join(mockPath2, cur);
    const stat = import_fs.default.statSync(curMockPath);
    const isFile = stat.isFile();
    const isDir = stat.isDirectory();
    const isJsOrTs = [".ts", ".js"].includes(import_path.default.extname(curMockPath));
    if (isDir) {
      let arr = getMockFiles(curMockPath);
      return prev.concat(arr);
    }
    if (isFile && isJsOrTs) {
      return [...prev, curMockPath];
    }
    return prev;
  }, []);
}
function getMockConfig() {
  const mockConfig = {};
  const mockFiles = getMockFiles(mockPath);
  mockFiles.forEach((mockFile) => {
    const mockData = require(mockFile) || {};
    if (require.cache[mockFile]) {
      delete require.cache[mockFile];
    }
    Object.assign(mockConfig, mockData.default || mockData);
  });
  return mockConfig;
}
function parseApi(api) {
  let method = "get", url = api;
  if (/\s+/.test(api)) {
    const splited = api.split(/\s+/);
    method = splited[0].toLowerCase();
    url = splited[1];
  }
  (0, import_assert.default)(OPTIONAL_METHODS.includes(method), `Invalid method ${method} for path ${api}, please check your mock files.`);
  return {
    method,
    url
  };
}
function createHandler(method, handler) {
  return function(req, res, next) {
    if (!BODY_METHODS.includes(method)) {
      sendData();
    } else {
      const jsonOpts = {
        limit: "5mb",
        strict: false
      };
      const urlOpts = {
        limit: "5mb",
        extended: true
      };
      import_body_parser.default.json(jsonOpts)(req, res, () => {
        import_body_parser.default.urlencoded(urlOpts)(req, res, () => {
          sendData();
        });
      });
    }
    function sendData() {
      if (typeof handler !== "function") {
        const data = import_mockjs.default.mock(handler);
        res.json(data);
      } else {
        handler(req, res, next);
      }
    }
  };
}
function parseMockConfig() {
  let mockConfigList = [];
  const mockConfig = getMockConfig();
  Object.keys(mockConfig).forEach((api) => {
    const handler = mockConfig[api];
    (0, import_assert.default)(["function", "object", "string"].includes(typeof handler), `mock value of ${api} should be function or object or string, but got ${typeof handler}`);
    let { method, url } = parseApi(api);
    mockConfigList.push({
      method,
      url,
      handler: createHandler(method, handler)
    });
  });
  return mockConfigList;
}
function matchPath(req, mockConfigList) {
  const { method: reqMethod, path: reqPath } = req;
  const targetMock = mockConfigList.find((item) => {
    const { method: mockMethod, url: mockPath2 } = item;
    const re = (0, import_path_to_regexp.pathToRegexp)(mockPath2);
    const methodMatch = mockMethod.toLowerCase() === reqMethod.toLowerCase();
    const pathMatch = re.exec(reqPath);
    if (methodMatch && pathMatch) {
      return true;
    }
    return false;
  });
  return targetMock;
}
var watcher;
function applyMock(app) {
  let mockConfigList = parseMockConfig();
  if (!watcher) {
    watcher = (0, import_chokidar.watch)([mockPath]);
    watcher.on("ready", () => {
      watcher.on("all", (event, filePath) => {
        let info = `
${event.toUpperCase()} ${filePath}`;
        console.log("\x1B[32m%s\x1B[0m", info);
        mockConfigList = parseMockConfig();
      });
    });
  }
  app.use((req, res, next) => {
    const match = mockConfigList.length && matchPath(req, mockConfigList);
    if (match) {
      return match.handler(req, res, next);
    }
    return next();
  });
}
module.exports = (app) => {
  try {
    applyMock(app);
  } catch (e) {
    console.log(e);
    console.log("\x1B[31m%s\x1B[0m", "\nFailed to parse mock config.\n");
    const watcher2 = (0, import_chokidar.watch)([mockPath]);
    watcher2.on("ready", () => {
      watcher2.on("all", (event, filePath) => {
        let info = `
${event.toUpperCase()} ${filePath}`;
        console.log("\x1B[32m%s\x1B[0m", info);
        watcher2.close();
        applyMock(app);
      });
    });
  }
};
