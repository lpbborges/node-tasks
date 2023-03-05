import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { knex } from '../database'

export async function checkTaskExists(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const getTaskParamsSchema = z.object({
    id: z.string().uuid(),
  })

  const { id } = getTaskParamsSchema.parse(request.params)

  const task = await knex('tasks').where('id', id).select('*').first()

  console.log('task', task)

  if (!task) {
    return reply.status(404).send({
      error: 'Not found',
    })
  }
}
