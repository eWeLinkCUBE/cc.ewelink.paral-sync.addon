import { Request, Response } from "express";
import sseClass from "../ts/class/sse";
import logger from "../log";

export default async function sse(req: Request, res: Response) {
    try {
        sseClass.buildStreamContext(req, res);
    } catch (err) {
        logger.info("build sse connection error: ", err);
    }
}