import logger from '#config/logger.js'
import { createUser } from '#services/auth.service.js'
import { formatValidationError } from '#utils/format.js'
import { signupSchema } from '#validations/auth.validation.js'
import { jwttoken } from '#utils/jwt.js'
import { cookies } from '#utils/cookies.js'


export const signup = async (req, res, next) => {
    try {

        // We validate the schema
        const validationResult = signupSchema.safeParse(req.body) 

        // Handle error if validation fails
        if(!validationResult.success){
            return res.status(400).json({
                error: 'Validation failed',
                details: formatValidationError(validationResult.error)
            })
        }

        // If there's nothing, we retrieve user informations
        const { name, email, role, password } = validationResult.data

        // Then we call the auth service to create an account
        const user = await createUser({ name, email, password, role })
        
        // Create the JWT Token
        const token = jwttoken.sign({id: user.id, name: user.name, email: user.email, role: user.role})
        
        // Setting the cookie by inserting the token
        cookies.set(res, 'token', token)
        
        logger.info(`User registered successfully : ${email}`)
        res.status(201).json({
            message: "User registered",
            user: {
                id: user.id, name: user.name, email: user.email, role: user.role
            }
        })

    } catch (e) {
        logger.error('Signup error', e)

        if(e.message === 'User email already exists'){
            return res.status(409).json({ error: 'Email already exists' })
        }

        next(e)
    }
}