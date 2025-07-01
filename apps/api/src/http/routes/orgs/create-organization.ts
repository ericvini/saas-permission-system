import { authMiddleware } from '@/http/middlewares/auth'
import { FastifyInstance } from 'fastify'
import { BandRequestError } from '../_errors/bad-request-error'
import { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { createSlug } from '@/utils/create-slug'

export async function createOrganization(app: FastifyInstance) {
  app
    .withTypeProvider<ZodTypeProvider>()
    .register(authMiddleware)
    .post(
      '/organization',
      {
        schema: {
          tags: ['Organizations'],
          summary: 'Create a new organization',
          security: [{ bearerAuth: [] }],
          body: z.object({
            name: z.string(),
            domain: z.string().nullish(),
            shouldAttachUsersByDomain: z.boolean().optional(),
          }),
          response: {
            201: z.object({
              organizationId: z.string().uuid(),
            }),
          },
        },
      },
      async (request, reply) => {
        const userId = await request.getCurrentUserId()
        const { name, domain, shouldAttachUsersByDomain } = request.body

        if (domain) {
          const existingOrg = await prisma.organization.findUnique({
            where: { domain },
          })
          if (existingOrg) {
            throw new BandRequestError(
              'Organization with this domain already exists'
            )
          }
        }

        const organization = await prisma.organization.create({
          data: {
            name,
            domain,
            slug: createSlug(name),
            shouldAttachUsersByDomain,
            ownerId: userId,
            members: {
              create: {
                userId,
                role: 'ADMIN',
              },
            },
          },
          select: {
            id: true,
          },
        })

        return reply.status(201).send({ organizationId: organization.id })
      }
    )
}
