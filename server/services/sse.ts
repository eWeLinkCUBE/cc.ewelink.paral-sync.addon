import { Request, Response } from "express";
import sseClass from "../ts/class/sse";

export default async function sse(req: Request, res: Response) {
    sseClass.buildStreamContext(req, res);
}