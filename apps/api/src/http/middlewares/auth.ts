import type { FastifyInstance } from 'fastify'
import { UnauthorizedError } from '../routes/_errors/unauthorizes-error'
import fastifyPlugin from 'fastify-plugin'

declare module 'fastify' {
  interface FastifyRequest {
    getCurrentUserId: () => Promise<string>
  }
}

export const authMiddleware = fastifyPlugin(async (app: FastifyInstance) => {
  app.addHook('preHandler', async (request) => {
    request.getCurrentUserId = async () => {
      try {
        const { sub } = await request.jwtVerify<{ sub: string }>()
        return sub
      } catch (err) {
        throw new UnauthorizedError('Invalid JWT token')
      }
    }
  })
})
