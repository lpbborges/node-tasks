import fastify from 'fastify'
import { tasksRoute } from './routes/tasks'
import fastifyMultipart from '@fastify/multipart'

export const app = fastify({ logger: true })
app.register(fastifyMultipart,
  { 
    attachFieldsToBody: 'keyValues',
    limits: {
      files: 1,
      fields: 1,
    }
  }
)
app.register(tasksRoute, {
  prefix: 'tasks',
})
