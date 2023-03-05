import fastify from 'fastify'
import { tasksRoute } from './routes/tasks'

export const app = fastify()
app.register(tasksRoute, {
  prefix: 'tasks',
})
