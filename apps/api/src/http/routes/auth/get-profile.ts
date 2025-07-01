import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { BandRequestError } from '../_errors/bad-request-error'
import { authMiddleware } from '@/http/middlewares/auth'

export async function getProfile(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(authMiddleware)
    .get(
      '/profile',
      {
        schema: {
          tags: ['Auth'],
          summary: 'Get user profile',
          security: [{ bearerAuth: [] }],
          response: {
            200: z.object({
              user: z.object({
                id: z.string().uuid(),
                email: z.string().email(),
                name: z.string().min(2).max(100),
                avatarUrl: z.string().url().nullable(),
              }),
            }),
          },
        },
      },
      async (request, reply) => {
        const userId = await request.getCurrentUserId()

        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            email: true,
            name: true,
            avatarUrl: true,
          },
        })

        if (!user) {
          throw new BandRequestError('User not found')
        }

        return reply.send({ user: { ...user, name: user.name ?? '' } })
      }
    )
}
