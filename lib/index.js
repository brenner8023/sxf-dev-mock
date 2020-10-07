"use strict";
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require('fs');
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
    var mockFiles = fs.readdirSync(mockPath);
    return mockFiles.reduce(function (prev, cur) {
        var curMockPath = path.join(mockPath, cur);
        var stat = fs.statSync(curMockPath);
        var isFile = stat.isFile();
        var isDir = stat.isDirectory();
        var isJsOrTs = ['.ts', '.js'].includes(path.extname(curMockPath));
        if (isDir) {
            var arr = getMockFiles(curMockPath);
            return prev.concat(arr);
        }
        if (isFile && isJsOrTs) {
            return __spreadArrays(prev, [curMockPath]);
        }
        return prev;
    }, []);
}
/**
 * 从js或ts文件中获取mock数据配置
 */
function getMockConfig() {
    var mockConfig = {};
    var mockFiles = getMockFiles(mockPath);
    mockFiles.forEach(function (mockFile) {
        var mockData = require(mockFile) || {};
        // 清理node对require的缓存，这样才能获取到修改后的mock数据
        if (require.cache[mockFile]) {
            delete require.cache[mockFile];
        }
        Object.assign(mockConfig, mockData.default || mockData);
    });
    return mockConfig;
}
/**
 * 解析并返回请求方法和请求path
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
    var mockConfigList = [];
    var mockConfig = getMockConfig();
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
    return mockConfigList;
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
function applyMock(app) {
    var mockConfigList = parseMockConfig();
    var watcher = chokidar.watch([mockPath]);
    watcher.on('ready', function () {
        watcher.on('all', function (event, filePath) {
            var info = "\n" + event.toUpperCase() + " " + filePath;
            console.log('\x1B[32m%s\x1B[0m', info);
            mockConfigList = parseMockConfig();
        });
    });
    app.use(function (req, res, next) {
        var match = mockConfigList.length && matchPath(req, mockConfigList);
        if (match) {
            return match.handler(req, res, next);
        }
        return next();
    });
}
module.exports = function (app) {
    try {
        applyMock(app);
    }
    catch (e) {
        console.log(e);
        console.log('\x1B[31m%s\x1B[0m', '\nFailed to parse mock config.\n');
        var watcher_1 = chokidar.watch([mockPath]);
        watcher_1.on('ready', function () {
            watcher_1.on('all', function (event, filePath) {
                var info = "\n" + event.toUpperCase() + " " + filePath;
                console.log('\x1B[32m%s\x1B[0m', info);
                watcher_1.close();
                applyMock(app);
            });
        });
    }
};
