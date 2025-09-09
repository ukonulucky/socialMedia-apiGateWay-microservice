import dotenv from "dotenv"
dotenv.config()
import cors from "cors"
import express, { NextFunction, Request, Response } from "express"
import logger from "./utils/logger"
import helmet from "helmet"
import proxy from "express-http-proxy"
import { errorHandler } from "./middleware/errorHandler"
import { validateTokenMiddleware } from "./middleware/authMiddleware"
import { CustomRequest } from "./types"

const app = express()
const PORT = process.env.PORT || 5000

// middleware 
app.use(helmet())
app.use(cors())
app.use(express.json())


app.use((req, res, next) => { 
    logger.info(`request from ${req.url} having a method of ${req.method}`)
    next()
})

const proxyOptions = {
    proxyReqPathResolver(req: Request) {
        const newUrl = req.originalUrl.replace(/^\/v1/, "/api")
        return newUrl
    },
    proxyErrorHandler: (err: any, res: Response, next: NextFunction) => { 
        logger.error(`Proxy error:`, err)
        res.status(500).json({
            message: "Internal server error",
            status: false,
            error: err.message
        })
   
    }
}

//endpoints for auth services
app.use('/v1/auth', proxy(process.env.AUTH_SERVICE_URL as string, {
    ...proxyOptions,
    proxyReqOptDecorator: (proxyRegOpt, srcReg) => { 
        proxyRegOpt.headers["content-type"] = "application/json"
        return proxyRegOpt
    },
    userResDecorator(proxyRes, proxyResData, userReq, userRes) {
        return proxyResData
    }
   
}));

// endpoint for contribtion services
app.use("/v1/contribution", validateTokenMiddleware, proxy(process.env.CONTRIBUTION_SERVICE_URL as string, { ...proxyOptions,
    proxyReqOptDecorator: (proxyRegOpts, srcReq:CustomRequest) => { 
        proxyRegOpts.headers["content-type"] = "application/json"
        proxyRegOpts.headers["x-user-id"] = proxyRegOpts.headers.userid
        return proxyRegOpts
    },
    userResDecorator(proxyRes, proxyResData, userReq, userRes) {
        return proxyResData
    }
}))

//endpoint for payment-services
app.use("/v1/payment", validateTokenMiddleware, proxy(process.env.PAYMENT_SERVICE_URL as string, { ...proxyOptions,
    proxyReqOptDecorator: (proxyRegOpts, srcReq:CustomRequest) => { 
        proxyRegOpts.headers["content-type"] = "application/json"
        proxyRegOpts.headers["x-user-id"] = proxyRegOpts.headers.userid
        return proxyRegOpts
    },
    userResDecorator(proxyRes, proxyResData, userReq, userRes) {
        return proxyResData
    }
}))

app.get("/", (req, res) => { 
    console.log("Root route accessed");
    res.send(`Server running on port ${PORT}`)
 })


// universal error handler
app.use(errorHandler)

app.listen(PORT, async() => { 
    try {
        logger.info(`App at api-gateway started at port ${PORT}`)
    } catch (error) {
        logger.error(`Application error, ${error}`)
        console.log(`Application erorr occured`, error)
        process.exit()
    }
})