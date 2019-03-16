"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require('fs').promises;
var path = require('path');
var assert = require('assert');
var bodyParser = require('body-parser');
var chokidar = require('chokidar');
var pathToRegexp = require('path-to-regexp').pathToRegexp;
var OPTIONAL_METHODS = ['get', 'post', 'put', 'patch', 'delete'];
var BODY_METHODS = OPTIONAL_METHODS.filter(function (method) { return method !== 'get'; });
var rootDir = process.cwd();
var mockPath = path.resolve(rootDir, 'mock');
/**
 * 递归读取mock目录下的所有js文件，ts文件
 * @param mockPath 目录的绝对路径
 * @returns mock目录下所有js文件，ts文件路径组成的数组
 */
function getMockFiles(mockPath) {
    return __awaiter(this, void 0, void 0, function () {
        var mockFiles;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, fs.readdir(mockPath)];
                case 1:
                    mockFiles = _a.sent();
                    return [4 /*yield*/, mockFiles.reduce(function (prev, cur) { return __awaiter(_this, void 0, void 0, function () {
                            var curMockPath, stat, isFile, isDir, isJsOrTs, arr;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        curMockPath = path.join(mockPath, cur);
                                        return [4 /*yield*/, fs.stat(curMockPath)];
                                    case 1:
                                        stat = _a.sent();
                                        isFile = stat.isFile();
                                        isDir = stat.isDirectory();
                                        isJsOrTs = ['.ts', '.js'].includes(path.extname(curMockPath));
                                        return [4 /*yield*/, prev];
                                    case 2:
                                        prev = _a.sent();
                                        if (!isDir) return [3 /*break*/, 4];
                                        return [4 /*yield*/, getMockFiles(curMockPath)];
                                    case 3:
                                        arr = _a.sent();
                                        return [2 /*return*/, prev.concat(arr)];
                                    case 4:
                                        if (isFile && isJsOrTs) {
                                            return [2 /*return*/, __spreadArrays(prev, [curMockPath])];
                                        }
                                        return [2 /*return*/, prev];
                                }
                            });
                        }); }, [])];
                case 2: return [2 /*return*/, _a.sent()];
            }
        });
    });
}
/**
 * 从js或ts文件中获取mock数据配置
 */
function getMockConfig() {
    return __awaiter(this, void 0, void 0, function () {
        var mockConfig, mockFiles;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    mockConfig = {};
                    return [4 /*yield*/, getMockFiles(mockPath)];
                case 1:
                    mockFiles = _a.sent();
                    mockFiles.forEach(function (mockFile) {
                        var mockData = require(mockFile) || {};
                        // 清理node对require的缓存，这样才能获取到修改后的mock数据
                        if (require.cache[mockFile]) {
                            delete require.cache[mockFile];
                        }
                        Object.assign(mockConfig, mockData);
                    });
                    return [2 /*return*/, mockConfig];
            }
        });
    });
}
/**
 * 解析返回请求方法和请求path
 * @param api 形如'get /api/users/123'
 */
function parseApi(api) {
    var method = 'get', url = api;
    if (/\s+/.test(api)) {
        var splited = api.split(/\s+/);
        method = splited[0].toLowerCase();
        url = splited[1];
    }
    assert(OPTIONAL_METHODS.includes(method), "Invalid method " + method + " for path " + api + ", please check your mock files.");
    return {
        method: method,
        url: url
    };
}
/**
 * 创建一个路由回调函数
 * @param method 请求方法
 * @param handler 响应的数据
 */
function createHandler(method, handler) {
    return function (req, res, next) {
        if (!BODY_METHODS.includes(method)) {
            sendData();
        }
        else {
            var jsonOpts = {
                limit: '5mb',
                strict: false
            };
            var urlOpts_1 = {
                limit: '5mb',
                extended: true
            };
            bodyParser.json(jsonOpts)(req, res, function () {
                bodyParser.urlencoded(urlOpts_1)(req, res, function () {
                    sendData();
                });
            });
        }
        function sendData() {
            if (typeof handler !== 'function') {
                res.json(handler);
            }
            else {
                handler(req, res, next);
            }
        }
    };
}
/**
 * 解析mock配置，转为数组，数组元素包含请求方法、请求path，回调函数
 */
function parseMockConfig() {
    return __awaiter(this, void 0, void 0, function () {
        var mockConfigList, mockConfig;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    mockConfigList = [];
                    return [4 /*yield*/, getMockConfig()];
                case 1:
                    mockConfig = _a.sent();
                    Object.keys(mockConfig).forEach(function (api) {
                        var handler = mockConfig[api];
                        assert(['function', 'object', 'string'].includes(typeof handler), "mock value of " + api + " should be function or object or string, but got " + typeof handler);
                        var _a = parseApi(api), method = _a.method, url = _a.url;
                        mockConfigList.push({
                            method: method,
                            url: url,
                            handler: createHandler(method, handler)
                        });
                    });
                    return [2 /*return*/, mockConfigList];
            }
        });
    });
}
/**
 * 根据请求的path，找出对应的mock配置
 * @param req
 * @param mockConfigList
 */
function matchPath(req, mockConfigList) {
    var reqMethod = req.method, reqPath = req.path;
    var targetMock = mockConfigList.find(function (item) {
        var mockMethod = item.method, mockPath = item.url;
        var re = pathToRegexp(mockPath);
        var methodMatch = mockMethod.toLowerCase() === reqMethod.toLowerCase();
        var pathMatch = re.exec(reqPath);
        if (methodMatch && pathMatch) {
            return true;
        }
        return false;
    });
    return targetMock;
}
module.exports = function (app) { return __awaiter(void 0, void 0, void 0, function () {
    var mockConfigList, watcher, watchFiles;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, parseMockConfig()];
            case 1:
                mockConfigList = _a.sent();
                watcher = chokidar.watch([mockPath]);
                watchFiles = new Set();
                watcher.on('all', function (event, filePath) { return __awaiter(void 0, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                /**
                                 * chokidar第一次监听时，不调用parseMockConfig
                                 */
                                if (!watchFiles.has(filePath)) {
                                    watchFiles.add(filePath);
                                    return [2 /*return*/];
                                }
                                console.log(event.toUpperCase(), filePath);
                                return [4 /*yield*/, parseMockConfig()];
                            case 1:
                                mockConfigList = _a.sent();
                                return [2 /*return*/];
                        }
                    });
                }); });
                app.use(function (req, res, next) {
                    var match = mockConfigList.length && matchPath(req, mockConfigList);
                    if (match) {
                        return match.handler(req, res, next);
                    }
                    return next();
                });
                return [2 /*return*/];
        }
    });
}); };
