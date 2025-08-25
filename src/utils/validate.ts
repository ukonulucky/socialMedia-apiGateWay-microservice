import Joi from "joi"
import { userRegisterType } from "../types/appTypes"


export const registerValidation = (data: userRegisterType) => { 

    const schema = Joi.object({
        userName: Joi.string().min(3).max(15).required(),
        email: Joi.string().email().required(),
        password:Joi.string().min(5).max(15).required()
    })

    return schema.validate(data)

}