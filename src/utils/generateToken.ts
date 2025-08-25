import { generateTokenType, userSchemaType } from "../types/appTypes";
import jwt from "jsonwebtoken"
import crypto from "crypto"
import { deflate } from "zlib";

export const generateToken = (user: userSchemaType): generateTokenType => { 
    if (!user._id) { 
        throw new Error("User id not found")
    }
    const accessToken = jwt.sign({
        userId: user._id,
        username: user.userName
    }, process.env.JWT_SECRET as string)

    const refreshToken = crypto.randomBytes(40).toString("hex")
    const expiresAt = new Date();

    expiresAt.setDate(expiresAt.getDate() + 7) // expires in 7days
     
    return {
        accessToken,
        expiresAt,
        userId:user._id
        
    }
}




