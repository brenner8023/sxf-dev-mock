
import type { Request } from './type';

let isRemote = false;

/**
 * 判断是联调还是本地mock
 * @param req 请求
 * @returns 是否联调
 */
export function isRemoteReq(req: Request) {
  const referer = req.headers.referer;
  if (referer?.includes('remote=1')) {
    isRemote = true;
  } else if (referer?.includes('remote=0')) {
    isRemote = false;
  }
  return isRemote;
}
