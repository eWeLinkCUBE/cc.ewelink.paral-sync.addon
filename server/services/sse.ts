import { Request, Response } from "express";
import ownSse from "../ts/class/sse";
import logger from "../log";

export default async function sse(req: Request, res: Response) {
    try {
        ownSse.buildStreamContext(req, res);
    } catch (err) {
        logger.info("build sse connection error: ", err);
    }
}