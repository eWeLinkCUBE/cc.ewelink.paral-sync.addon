import { Request, Response } from "express";
import destSse from "../ts/class/destSse";
import logger from "../log";

export default async function sse(req: Request, res: Response) {
    try {
        destSse.buildStreamContext(req, res);
    } catch (err) {
        logger.info("build sse connection error: ", err);
    }
}