import type {
  IMockConfig,
  HandlerType,
  Application, Request, Response, NextFunction,
} from './type';
import Mock from 'mockjs';
import fs from 'fs';
import path from 'path';
import assert from 'assert';
import bodyParser from 'body-parser';
import { watch } from 'chokidar';
import { pathToRegexp } from 'path-to-regexp';

const OPTIONAL_METHODS = ['get', 'post', 'put', 'patch', 'delete'];
const BODY_METHODS = OPTIONAL_METHODS.filter(method => method !== 'get');
const rootDir = process.cwd();
const mockPath = path.resolve(rootDir, 'mock');

/**
 * 递归读取mock目录下的所有js文件，ts文件
 * @param mockPath 目录的绝对路径
 * @returns mock目录下所有js文件，ts文件路径组成的数组
 */
function getMockFiles(mockPath: string): string[] {
  const mockFiles = fs.existsSync(mockPath) ? fs.readdirSync(mockPath) : [];

  return mockFiles.reduce((prev: string[], cur: string) => {
    const curMockPath = path.join(mockPath, cur);
    const stat = fs.statSync(curMockPath);
    const isFile = stat.isFile();
    const isDir = stat.isDirectory();
    const isJsOrTs = ['.ts', '.js'].includes(path.extname(curMockPath));

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

/**
 * 从js或ts文件中获取mock数据配置
 */
function getMockConfig() {
  const mockConfig: Record<string, HandlerType> = {};
  const mockFiles = getMockFiles(mockPath);

  mockFiles.forEach((mockFile: string) => {

    const mockData = require(mockFile) || {};

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
function parseApi(api: string) {
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
function createHandler(method: string, handler: HandlerType) {
  return function (req: Request, res: Response, next?: NextFunction) {
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

    function sendData() {
      if (typeof handler !== 'function') {
        const data = Mock.mock(handler);
        res.json(data);
      } else {
        handler(req, res, next);
      }
    }
  };
}

/**
 * 解析mock配置，转为数组，数组元素包含请求方法、请求path，回调函数
 */
function parseMockConfig() {
  let mockConfigList: Array<IMockConfig> = [];
  const mockConfig = getMockConfig();

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
function matchPath(req: Request, mockConfigList: Array<IMockConfig>) {
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

let watcher: any;
function applyMock(app: Application) {
  let mockConfigList = parseMockConfig();

  if (!watcher) {
    watcher = watch([mockPath]);

    watcher.on('ready', () => {
      watcher.on('all', (event: string, filePath: string) => {
        let info = `\n${event.toUpperCase()} ${filePath}`;
        console.log('\x1B[32m%s\x1B[0m', info);
        mockConfigList = parseMockConfig();
      });
    });
  }

  app.use((req: Request, res: Response, next: NextFunction) => {
    const match = mockConfigList.length && matchPath(req, mockConfigList);

    if (match) {
      return match.handler(req, res, next);
    }
    return next();
  });
}

module.exports = (app: Application) => {
  try {
    applyMock(app);
  } catch (e) {
    console.log(e);
    console.log('\x1B[31m%s\x1B[0m', '\nFailed to parse mock config.\n');

    const watcher = watch([mockPath]);

    watcher.on('ready', () => {
      watcher.on('all', (event: string, filePath: string) => {
        let info = `\n${event.toUpperCase()} ${filePath}`;
        console.log('\x1B[32m%s\x1B[0m', info);
        watcher.close();
        applyMock(app);
      });
    });
  }
};
