import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { UnauthorizedError } from '../_errors/unauthorizes-error'
import { hash } from 'bcryptjs'

export async function requestPassword(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    '/password/reset',
    {
      schema: {
        tags: ['Auth'],
        summary: 'Request password reset',
        body: z.object({
          code: z.string(),
          password: z.string().min(6),
        }),
        response: {
          201: z.null(),
        },
      },
    },
    async (request, reply) => {
      const { code: recoverCode, password } = request.body

      const token = await prisma.token.findUnique({
        where: { id: recoverCode },
      })

      if (!token) {
        throw new UnauthorizedError()
      }

      const passwordHash = await hash(password, 6)

      await prisma.user.update({
        where: { id: token.userId },
        data: {
          passwordHash,
        },
      })
    }
  )
}
