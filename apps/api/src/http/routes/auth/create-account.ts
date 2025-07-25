import { FastifyInstance } from 'fastify'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { hash } from 'bcryptjs'
import { BandRequestError } from '../_errors/bad-request-error'

export async function createAccount(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    '/users',
    {
      schema: {
        tags: ['Auth'],
        body: z.object({
          name: z.string(),
          email: z.string().email(),
          password: z.string().min(6),
        }),
      },
    },
    async (request, reply) => {
      const { name, email, password } = request.body as {
        name: string
        email: string
        password: string
      }

      const userWithSameEmail = await prisma.user.findUnique({
        where: { email },
      })

      if (userWithSameEmail) {
        throw new BandRequestError(
          'User with this email already exists. Please use a different email.'
        )
      }

      const autoJoinedOrganization = await prisma.organization.findFirst({
        where: {
          shouldAttachUsersByDomain: true,
          domain: email.split('@')[1],
        },
      })

      const passwordHash = await hash(password, 6)

      await prisma.user.create({
        data: {
          name,
          email,
          passwordHash,
          member_on: autoJoinedOrganization
            ? {
                create: {
                  organizationId: autoJoinedOrganization.id,
                },
              }
            : undefined,
        },
      })

      return reply.status(201).send()
    }
  )
}
