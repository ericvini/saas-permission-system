import { FastifyInstance } from 'fastify'
import { ZodError } from 'zod'
import { BandRequestError } from './routes/_errors/bad-request-error'
import { UnauthorizedError } from './routes/_errors/unauthorizes-error'

type FastrifyErrorHandler = FastifyInstance['errorHandler']

export const errorHandler: FastrifyErrorHandler = (error, request, reply) => {
  if (error instanceof ZodError) {
    return reply.status(400).send({
      message: 'Validation error',
      errors: error.flatten().fieldErrors,
    })
  }

  if (error instanceof BandRequestError) {
    return reply.status(400).send({
      message: error.message,
    })
  }

  if (error instanceof UnauthorizedError) {
    return reply.status(401).send({
      message: error.message,
    })
  }

  return reply.status(500).send({ message: 'Internal server error' })
}
