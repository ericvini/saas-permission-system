import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { BandRequestError } from '../_errors/bad-request-error'
import { authMiddleware } from '@/http/middlewares/auth'

export async function requestPasswordRecover(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    '/password/recover',
    {
      schema: {
        tags: ['Auth'],
        summary: 'Request password recovery',
        body: z.object({
          email: z.string().email(),
        }),
        response: {
          201: z.null(),
        },
      },
    },
    async (request, reply) => {
      const { email } = request.body

      const user = await prisma.user.findUnique({
        where: { email },
      })

      if (!user) {
        return reply.status(201).send()
      }

      const { id: code } = await prisma.token.create({
        data: {
          userId: user.id,
          type: 'PASSWORD_RECOVERY',
        },
      })
      console.log(`Password recovery code for ${email}: ${code}`)

      return reply.status(201).send()
    }
  )
}
