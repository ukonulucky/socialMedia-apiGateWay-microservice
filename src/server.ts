import dotenv from "dotenv"
dotenv.config()
import cors from "cors"
import express, { Request } from "express"
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
        console.log(req.originalUrl)
        const newUrl = req.originalUrl.replace(/^\/v1/, "/api")
        console.log(newUrl)
        return newUrl
    },
    proxyErrorHandler: (err: any, res: express.Response, next: express.NextFunction) => { 
        logger.error(`Proxy error:`, err)
        res.status(500).json({
            message: "Internal server error",
            status: false,
            error: err.message
        })
   
    }
}

//endpoints
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


app.use("/v1/post", validateTokenMiddleware, proxy(process.env.POST_SERVICE_URL as string, { ...proxyOptions,
    proxyReqOptDecorator: (proxyRegOpts, srcReq:CustomRequest) => { 
        proxyRegOpts.headers["content-type"] = "application/json"
        console.log("src", srcReq.userId)
        proxyRegOpts.headers["x-user-id"] = srcReq.userId 
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