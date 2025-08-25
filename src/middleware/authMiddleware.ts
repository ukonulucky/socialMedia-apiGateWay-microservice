import { NextFunction, Request, Response } from "express";
import logger from "../utils/logger";
import jwt from "jsonwebtoken"
import { CustomRequest, MyJwtPayload } from "../types";



export const validateTokenMiddleware = (req: CustomRequest, res: Response, next: NextFunction) => { 
    logger.info("user hit the validateTokenMiddleware")
    const authHeader = req.headers["authorization"]

    const token = authHeader && authHeader.split(" ")[1] // seperate the token from the bearer token

    if (!token) { 
        logger.info("Attempt to login with oout a token")
        res.status(401).json({
            message: "Authorization required",
            status: false
        })
        return
    }
    // verify the token
    jwt.verify(token, process.env.JWT_SECRET as string, (err, decodedPayload) => { 
        if (err || !decodedPayload) { 
            logger.error("error occured when verifying jwt:", err)
           res.status(429).json({
                message: "Invalid token",
                status: false
           })
           return
        }
        
    
   console.log("decoded Payload:", decodedPayload)
        req.userId = (decodedPayload as MyJwtPayload)?.userId 
        next()
    }) 

    
 
    
}