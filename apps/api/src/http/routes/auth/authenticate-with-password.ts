import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { compare } from 'bcryptjs'
import { BandRequestError } from '../_errors/bad-request-error'

export async function authenticateWithPassword(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    '/sessions/password',
    {
      schema: {
        tags: ['Auth'],
        summary: 'Authenticate user with email and password',
        body: z.object({
          email: z.string().email(),
          password: z.string().min(6),
        }),
        response: {
          201: z.object({
            token: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      const { email, password } = request.body as {
        email: string
        password: string
      }

      const user = await prisma.user.findUnique({
        where: { email },
      })

      if (!user) {
        throw new BandRequestError('Invalid credentials')
      }

      if (user.passwordHash === null) {
        throw new BandRequestError(
          'User does not have a password, use social login instead'
        )
      }

      const isPasswordValid = await compare(password, user.passwordHash)

      if (!isPasswordValid) {
        throw new BandRequestError('Invalid credentials')
      }

      const token = await reply.jwtSign(
        {
          sub: user.id,
        },
        {
          sign: {
            expiresIn: '7d',
          },
        }
      )

      return reply.status(201).send({ token })
    }
  )
}
