import app from '../server/server';

export default function handler(req: any, res: any) {
  return (app as any)(req, res);
}
