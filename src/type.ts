import type { Application, Request, Response, NextFunction } from 'express';

export { Application, Request, Response, NextFunction }

type MockFunction = (req: Request, res: Response, next?: NextFunction) => void;

export type HandlerType = string | number | any[] | Record<string, any> | MockFunction;

export interface IMockConfig {
  method: string;
  url: string;
  handler: MockFunction;
}
