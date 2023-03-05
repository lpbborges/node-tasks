import { execSync } from 'node:child_process'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { app } from '../src/app'
import request from 'supertest'

describe('Task routes', () => {
  beforeAll(async () => {
    await app.ready()
  })

  beforeEach(() => {
    execSync('yarn knex migrate:rollback --all')
    execSync('yarn knex migrate:latest')
  })

  afterAll(async () => {
    await app.close()
  })

  it('should be able to create a new task', async () => {
    await request(app.server)
      .post('/tasks')
      .send({
        title: 'New Task',
        description: 'Description for the new task',
      })
      .expect(201)
  })

  it('should not be able to create a new task without a title or a description', async () => {
    await request(app.server)
      .post('/tasks')
      .send({
        description: 'Description for the new task',
      })
      .expect(400)

    await request(app.server)
      .post('/tasks')
      .send({
        title: 'New task',
      })
      .expect(400)
  })

  it('should be able to list all tasks', async () => {
    await request(app.server).post('/tasks').send({
      title: 'New Task',
      description: 'Description for the new task',
    })

    const listTasksResponse = await request(app.server)
      .get('/tasks')
      .expect(200)

    expect(listTasksResponse.body.tasks).toEqual([
      expect.objectContaining({
        title: 'New Task',
        description: 'Description for the new task',
      }),
    ])
  })

  it('should be able to list all tasks that matches with query search', async () => {
    await request(app.server).post('/tasks').send({
      title: 'Match task',
      description: 'It matches',
    })

    await request(app.server).post('/tasks').send({
      title: 'No match',
      description: 'No match',
    })

    const listTasksResponse = await request(app.server)
      .get('/tasks?search=Match task')
      .expect(200)

    expect(listTasksResponse.body.tasks).toEqual([
      expect.objectContaining({
        title: 'Match task',
        description: 'It matches',
      }),
    ])
    expect(listTasksResponse.body.tasks).toHaveLength(1)
  })

  it('should be able to get a specific task by id', async () => {
    await request(app.server).post('/tasks').send({
      title: 'New Task',
      description: 'Description for the new task',
    })

    const listTasksResponse = await request(app.server).get('/tasks')

    const taskId = listTasksResponse.body.tasks[0].id

    const getTaskResponse = await request(app.server)
      .get(`/tasks/${taskId}`)
      .expect(200)

    expect(getTaskResponse.body.task).toEqual(
      expect.objectContaining({
        title: 'New Task',
        description: 'Description for the new task',
      }),
    )
  })

  it('should be able to update a task', async () => {
    await request(app.server).post('/tasks').send({
      title: 'New Task',
      description: 'Description for the new task',
    })

    const listTasksResponse = await request(app.server).get('/tasks')

    const taskId = listTasksResponse.body.tasks[0].id

    await request(app.server)
      .put(`/tasks/${taskId}`)
      .send({
        title: 'Updated Task',
        description: 'Updated description',
      })
      .expect(204)

    const getTaskResponse = await request(app.server).get(`/tasks/${taskId}`)

    expect(getTaskResponse.body.task).toEqual(
      expect.objectContaining({
        title: 'Updated Task',
        description: 'Updated description',
      }),
    )
  })

  it('should be able to update a task', async () => {
    await request(app.server).post('/tasks').send({
      title: 'New Task',
      description: 'Description for the new task',
    })

    const listTasksResponse = await request(app.server).get('/tasks')

    const taskId = listTasksResponse.body.tasks[0].id

    await request(app.server).delete(`/tasks/${taskId}`).expect(204)

    const listTasksResponseAfterDelete = await request(app.server).get('/tasks')

    expect(listTasksResponseAfterDelete.body.tasks).toHaveLength(0)
  })

  it('should be able to complete a task', async () => {
    await request(app.server).post('/tasks').send({
      title: 'New Task',
      description: 'Description for the new task',
    })

    const listTasksResponse = await request(app.server).get('/tasks')

    const taskId = listTasksResponse.body.tasks[0].id

    await request(app.server).patch(`/tasks/${taskId}/complete`).expect(204)

    const getTaskResponse = await request(app.server).get(`/tasks/${taskId}`)

    expect(getTaskResponse.body.task.completed_at).not.toBeNull()
    // 2023-03-05 20:51:58
    expect(getTaskResponse.body.task.completed_at).toMatch(
      /^(\d{4})[-](0[1-9]|1[0-2])[-](0[1-9]|[1-2][0-9]|3[0-1]) (01[0-9]|2[0-3])[:]([0-5][0-9])[:]([0-5][0-9])$/,
    )
  })
})
