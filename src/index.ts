const fs = require('fs').promises;
const path = require('path');
const assert = require('assert');
const bodyParser = require('body-parser');
const chokidar = require('chokidar');
const { pathToRegexp } = require('path-to-regexp');

const OPTIONAL_METHODS = ['get', 'post', 'put', 'patch', 'delete'];
const BODY_METHODS = OPTIONAL_METHODS.filter(method => method !== 'get');
const rootDir = process.cwd();
const mockPath = path.resolve(rootDir, 'mock');

import { Application, Request, Response, NextFunction } from 'express';

interface IMockConfig {
    method: string;
    url: string;
    handler: (req: Request, res: Response, next: NextFunction) => void;
}
type HandlerType = string | object | Function;

/**
 * 递归读取mock目录下的所有js文件，ts文件
 * @param mockPath 目录的绝对路径
 * @returns mock目录下所有js文件，ts文件路径组成的数组
 */
async function getMockFiles (mockPath: string) {
    const mockFiles = await fs.readdir(mockPath);

    return await mockFiles.reduce(async (prev: string[], cur: string) => {
        const curMockPath = path.join(mockPath, cur);
        const stat = await fs.stat(curMockPath);
        const isFile = stat.isFile();
        const isDir = stat.isDirectory();
        const isJsOrTs = ['.ts', '.js'].includes(path.extname(curMockPath));

        prev = await prev;

        if (isDir) {
            let arr = await getMockFiles(curMockPath);
            return prev.concat(arr);
        }
        if (isFile && isJsOrTs) {
            return [...prev, curMockPath];
        }
        return prev;
    }, []);
}

/**
 * 从js或ts文件中获取mock数据配置
 */
async function getMockConfig () {
    const mockConfig: { [x: string]: string | object | Function; } = {};
    const mockFiles = await getMockFiles(mockPath);

    mockFiles.forEach((mockFile: string) => {
        const mockData = require(mockFile) || {};

        // 清理node对require的缓存，这样才能获取到修改后的mock数据
        if (require.cache[mockFile]) {
            delete require.cache[mockFile];
        }

        Object.assign(mockConfig, mockData);
    });

    return mockConfig;
}

/**
 * 解析返回请求方法和请求path
 * @param api 形如'get /api/users/123'
 */
function parseApi (api: string) {
    let method = 'get',
        url = api;

    if (/\s+/.test(api)) {
        const splited = api.split(/\s+/);
        method = splited[0].toLowerCase();
        url = splited[1];
    }
    assert(
        OPTIONAL_METHODS.includes(method),
        `Invalid method ${method} for path ${api}, please check your mock files.`
    );

    return {
        method,
        url
    };
}

/**
 * 创建一个路由回调函数
 * @param method 请求方法
 * @param handler 响应的数据
 */
function createHandler (method: string, handler: HandlerType) {
    return function (req: Request, res: Response, next: NextFunction) {
        if (!BODY_METHODS.includes(method)) {
            sendData();
        } else {
            const jsonOpts = {
                limit: '5mb',
                strict: false
            };
            const urlOpts = {
                limit: '5mb',
                extended: true
            };

            bodyParser.json(jsonOpts)(req, res, () => {
                bodyParser.urlencoded(urlOpts)(req, res, () => {
                    sendData();
                });
            });
        }

        function sendData () {
            if (typeof handler !== 'function') {
                res.json(handler);
            } else {
                handler(req, res, next);
            }
        }
    };
}

/**
 * 解析mock配置，转为数组，数组元素包含请求方法、请求path，回调函数
 */
async function parseMockConfig () {
    let mockConfigList: Array<IMockConfig> = [];
    const mockConfig = await getMockConfig();

    Object.keys(mockConfig).forEach(api => {
        const handler: HandlerType = mockConfig[api];

        assert(
            ['function', 'object', 'string'].includes(typeof handler),
            `mock value of ${api} should be function or object or string, but got ${typeof handler}`
        );

        let { method, url } = parseApi(api);

        mockConfigList.push({
            method,
            url,
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
function matchPath (req: Request, mockConfigList: Array<IMockConfig>) {
    const { method: reqMethod, path: reqPath } = req;

    const targetMock = mockConfigList.find((item: IMockConfig) => {
        const { method: mockMethod, url: mockPath } = item;
        const re = pathToRegexp(mockPath);
        const methodMatch = mockMethod.toLowerCase() === reqMethod.toLowerCase();
        const pathMatch = re.exec(reqPath);

        if (methodMatch && pathMatch) {
            return true;
        }
        return false;
    });

    return targetMock;
}

module.exports = async (app: Application) => {
    let mockConfigList = await parseMockConfig();
    const watcher = chokidar.watch([mockPath]);
    const watchFiles = new Set();

    watcher.on('all', async (event: string, filePath: string) => {

        /**
         * chokidar第一次监听时，不调用parseMockConfig
         */
        if (!watchFiles.has(filePath)) {
            watchFiles.add(filePath);
            return;
        }
        console.log(event.toUpperCase(), filePath);
        mockConfigList = await parseMockConfig();
    });

    app.use((req: Request, res: Response, next: NextFunction) => {
        const match = mockConfigList.length && matchPath(req, mockConfigList);

        if (match) {
            return match.handler(req, res, next);
        }
        return next();
    });
};
