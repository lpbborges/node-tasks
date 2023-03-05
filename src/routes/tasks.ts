import { randomUUID } from 'node:crypto'
import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { knex } from '../database'
import { checkTaskExists } from '../middlewares/check-task-exists'

export async function tasksRoute(app: FastifyInstance) {
  app.get('/', async (request) => {
    const getTaskQuerySchema = z.object({
      search: z.string().optional(),
    })

    const { search } = getTaskQuerySchema.parse(request.query)

    let tasks = []

    if (search) {
      tasks = await knex('tasks')
        .whereLike('title', `%${search}%`)
        .orWhereLike('description', `%${search}%`)
        .select('*')

      return { tasks }
    }

    tasks = await knex('tasks').select('*')

    return { tasks }
  })

  app.get('/:id', async (request) => {
    const getTaskParamsSchema = z.object({
      id: z.string().uuid(),
    })

    const { id } = getTaskParamsSchema.parse(request.params)

    const task = await knex('tasks').where('id', id).select('*')

    return { task }
  })

  app.post('/', async (request, reply) => {
    const createTaskBodySchema = z.object({
      title: z.string(),
      description: z.string(),
    })

    const _body = createTaskBodySchema.safeParse(request.body)

    if (_body.success === false) {
      return reply.status(400).send({
        error: "Must provide 'title' and 'description' to create a new task",
      })
    }

    const { title, description } = _body.data

    await knex('tasks').insert({
      id: randomUUID(),
      title,
      description,
    })

    return reply.status(201).send()
  })

  app.put('/:id', async (request, reply) => {
    const getTaskParamsSchema = z.object({
      id: z.string().uuid(),
    })

    const { id } = getTaskParamsSchema.parse(request.params)

    const updateTaskBodySchema = z.object({
      title: z.string().optional(),
      description: z.string().optional(),
    })

    const { title, description } = updateTaskBodySchema.parse(request.body)

    let updatedValues = {
      updated_at: knex.fn.now(),
    } as any

    if (title) {
      updatedValues = { ...updatedValues, title }
    }

    if (description) {
      updatedValues = { ...updatedValues, description }
    }

    await knex('tasks').where('id', id).update(updatedValues)

    return reply.status(204).send()
  })

  app.delete(
    '/:id',
    { preHandler: [checkTaskExists] },
    async (request, reply) => {
      const getTaskParamsSchema = z.object({
        id: z.string().uuid(),
      })

      const { id } = getTaskParamsSchema.parse(request.params)

      await knex('tasks').where('id', id).del()

      return reply.status(204).send()
    },
  )

  app.patch(
    '/:id/complete',
    { preHandler: [checkTaskExists] },
    async (request, reply) => {
      const getTaskParamsSchema = z.object({
        id: z.string().uuid(),
      })

      const { id } = getTaskParamsSchema.parse(request.params)

      const now = knex.fn.now()

      await knex('tasks').where('id', id).update({
        completed_at: now,
        updated_at: now,
      })

      return reply.status(204).send()
    },
  )
}
