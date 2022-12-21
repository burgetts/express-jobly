"use strict";

const request = require("supertest");

const db = require("../db");
const app = require("../app");

const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
  u1Token,
  u2Token // u2 is admin
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /jobs */ 

describe("POST /jobs", function () {
    const newJob = {
        title: "Professional Clown",
        salary: 15000,
        equity: "0",
        companyHandle: "c1"
    }

    test("works for authorized users", async function () {
        const resp = await request(app)
            .post("/jobs")
            .send(newJob)
            .set("authorization", `Bearer ${u2Token}`);
        expect(resp.statusCode).toEqual(201);
        expect(resp.body).toEqual({job: newJob});
      })

    test("shows unauthorized for users who aren't admins", async function () {
        const resp = await request(app)
            .post("/jobs")
            .send(newJob)
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(401);
        expect(resp.body.error.message).toEqual("Unauthorized");
      });

    test("bad request with missing data", async function () {
        const resp = await request(app)
            .post("/jobs")
            .send({
                title: "Professional Clown",
                salary: 15000,
            })
            .set("authorization", `Bearer ${u2Token}`);
        expect(resp.statusCode).toEqual(400);
      });

    test("bad request with invalid data", async function () {
        const resp = await request(app)
            .post("/jobs")
            .send({
            ...newJob,
            title: 15,
            })
            .set("authorization", `Bearer ${u2Token}`);
        expect(resp.statusCode).toEqual(400);
  });
})

/************************************** GET /jobs */ 

describe('GET /jobs', function () {
     test("ok for anon", async function () {
        const resp = await request(app).get("/jobs");
        expect(resp.body).toEqual({
          jobs: 
            [ 
                {
                    title: 'Software Engineer',
                    salary: 70000, 
                    equity: '0',
                    companyHandle: 'c1'
                },
                {
                    title:'Sous Chef',
                    salary: 60000, 
                     equity:'0', 
                    companyHandle:'c2'
                }
            ]
        })
    });

    test("fails: test next() handler", async function () {
        // there's no normal failure event which will cause this route to fail ---
        // thus making it hard to test that the error-handler works with it. This
        // should cause an error, all right :)
        await db.query("DROP TABLE jobs CASCADE");
        const resp = await request(app)
            .get("/jobs")
            .set("authorization", `Bearer ${u1Token}`);
        expect(resp.statusCode).toEqual(500);
      });

    test("filter by title", async function () {
      const resp = await request(app).get('/jobs?title=engineer')
      expect(resp.body).toEqual({jobs: [
        {
          title: 'Software Engineer',
          salary: 70000, 
          equity: '0',
          companyHandle: 'c1'
      },
      ]})
    })

    test("filter by minSalary", async function () {
      const resp = await request(app).get('/jobs?minSalary=65000')
      expect(resp.body).toEqual({jobs: [
        {
          title: 'Software Engineer',
          salary: 70000, 
          equity: '0',
          companyHandle: 'c1'
      },
      ]})
    })

    test("filter by equity", async function () {
      const resp = await request(app).get('/jobs?hasEquity=true')
      expect(resp.body).toEqual({jobs: []})
    })

    test("filter by all 3", async function () {
      const resp = await request(app).get('/jobs?title=engineer&hasEquity=false&minSalary=45000')
      expect(resp.body).toEqual({jobs: [
        {
          title: 'Software Engineer',
          salary: 70000, 
          equity: '0',
          companyHandle: 'c1'
      },
      ]})
    })
})
    
/************************************** GET /jobs/:id */ 

describe('GET /jobs/:id', function () {
    test("works for anon", async function () {
        const job = await db.query(`SELECT id FROM jobs WHERE title = 'Software Engineer'`)
        const id = job.rows[0].id
        const resp = await request(app).get(`/jobs/${id}`);
        expect(resp.body).toEqual({
           job: {
                title: 'Software Engineer',
                salary: 70000, 
                equity: '0',
                companyHandle: 'c1'
            },
        });
      });
    
    test("not found for no such company", async function () {
        const resp = await request(app).get(`/jobs/999`);
        expect(resp.statusCode).toEqual(404);
      });
    });

/************************************** PATCH /jobs/:id */ 

describe('PATCH /jobs/:id', function () {
    test("works for authorized users", async function () {
        const job = await db.query(`SELECT id FROM jobs WHERE title = 'Software Engineer'`)
        const id = job.rows[0].id
        const resp = await request(app)
            .patch(`/jobs/${id}`)
            .send({
              title: "Web Developer",
            })
            .set("authorization", `Bearer ${u2Token}`);
        expect(resp.body).toEqual({
          job: {
            title: 'Web Developer',
            salary: 70000, 
            equity: '0',
            companyHandle: 'c1'
        },
        });
      });
    

      test("doesn't work for anon", async function () {
        const job = await db.query(`SELECT id FROM jobs WHERE title = 'Software Engineer'`)
        const id = job.rows[0].id
        const resp = await request(app)
            .patch(`/jobs/${id}`)
            .send({
                title: "Web Developer",
            });
        expect(resp.statusCode).toEqual(401);
      });

      test("doesn't work for unauthorized users", async function () {
        const job = await db.query(`SELECT id FROM jobs WHERE title = 'Software Engineer'`)
        const id = job.rows[0].id
        const resp = await request(app)
        .patch(`/jobs/${id}`)
        .send({
            title: "Web Developer",
        })
        .set("authorization", `Bearer ${u1Token}`)
        expect(resp.statusCode).toEqual(401);
      })

      test("not found on no such job", async function () {
        const resp = await request(app)
            .patch(`/jobs/999`)
            .send({
                title: "Web Developer",
            })
            .set("authorization", `Bearer ${u2Token}`);
        expect(resp.statusCode).toEqual(404);
      });

      test("bad request on companyHandle change attempt", async function () {
        const job = await db.query(`SELECT id FROM jobs WHERE title = 'Software Engineer'`)
        const id = job.rows[0].id
        const resp = await request(app)
            .patch(`/jobs/${id}`)
            .send({
                companyHandle: 'c2',
            })
            .set("authorization", `Bearer ${u2Token}`);
        expect(resp.statusCode).toEqual(400);
      });

      test("bad request on invalid data", async function () {
        const job = await db.query(`SELECT id FROM jobs WHERE title = 'Software Engineer'`)
        const id = job.rows[0].id
        const resp = await request(app)
            .patch(`/jobs/${id}`)
            .send({
              title: 10,
            })
            .set("authorization", `Bearer ${u2Token}`);
            expect(resp.statusCode).toEqual(400);
      });
})

/************************************** DELETE /jobs/:id */ 

describe("DELETE /jobs/:id", function () {
    test("works for authorized users", async function () {
        const job = await db.query(`SELECT id FROM jobs WHERE title = 'Software Engineer'`)
        const id = job.rows[0].id
        const resp = await request(app)
            .delete(`/jobs/${id}`)
            .set("authorization", `Bearer ${u2Token}`);
            expect(resp.body).toEqual({ deleted: `${id}` });
      });

      test("unauth for non-admin users", async function () {
        const job = await db.query(`SELECT id FROM jobs WHERE title = 'Software Engineer'`)
        const id = job.rows[0].id
        const resp = await request(app)
            .delete(`/jobs/${id}`)
            .set("authorization", `Bearer ${u1Token}`);
            expect(resp.statusCode).toEqual(401);
      });

      test("unauth for anon", async function () {
        const job = await db.query(`SELECT id FROM jobs WHERE title = 'Software Engineer'`)
        const id = job.rows[0].id
        const resp = await request(app)
            .delete(`/jobs/${id}`);
        expect(resp.statusCode).toEqual(401);
      });

      test("not found for no such company", async function () {
        const resp = await request(app)
            .delete(`/jobs/999`)
            .set("authorization", `Bearer ${u2Token}`);
        expect(resp.statusCode).toEqual(404);
      });
})
