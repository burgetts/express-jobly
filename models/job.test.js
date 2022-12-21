"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError, ExpressError } = require("../expressError");
const Job = require("./job.js");

const {
    commonBeforeAll,
    commonBeforeEach,
    commonAfterEach,
    commonAfterAll,
  } = require("./_testCommon");
  
  beforeAll(commonBeforeAll);
  beforeEach(commonBeforeEach);
  afterEach(commonAfterEach);
  afterAll(commonAfterAll);

/************************************** create */

describe("create", function () {
    const newJob = {
        title: 'Janitor',
        salary: 50000,
        equity: "0",
        companyHandle: 'c1'
      };

    test("works", async function() {
        const job = await Job.create(newJob)
        expect(job).toEqual(newJob)

        const result = await db.query(
            `SELECT title, salary, equity, company_handle
             FROM jobs
             WHERE title = 'Janitor'`);
        expect(result.rows).toEqual([
        {
            title: 'Janitor',
            salary: 50000,
            equity: "0",
            company_handle: 'c1'
        },
      ]);
    });
    })

/************************************** findAll */

 describe("findAll", function () {
    test("works: no filter", async function () {
        const jobs = await Job.findAll()
        expect(jobs).toEqual([
            {
                title: 'Software Engineer',
                salary: 70000,
                equity: "0",
                companyHandle: 'c1'   
            },
            {
                title: 'Sous Chef',
                salary: 60000,
                equity: "0",
                companyHandle: 'c2' 
            }
        ])
    })
})

/************************************** get */

 describe("get", function () {
    test("works", async function() {
        let results = await db.query(`SELECT id 
                                      FROM jobs
                                      WHERE title = 'Software Engineer'`)
        const id = results.rows[0].id
        let job = await Job.get(id)
        expect(job).toEqual({ 
            title: 'Software Engineer',
            salary: 70000,
            equity: "0",
            companyHandle: 'c1' })
    })

    test("not found if no such job", async function () {
        try {
            await Job.get(9999);
            fail();
        } catch (err) {
            expect(err instanceof NotFoundError).toBeTruthy();
        }
    });
});

/************************************** update */

describe("update", function () {
    test("works", async function () {
        let results = await db.query(`SELECT id 
                                      FROM jobs
                                      WHERE title = 'Software Engineer'`)
        const id = results.rows[0].id
        const updateData = {
            title: 'Software Developer',
            salary: 78000,
            equity: "0.03"
        }
        const update = await Job.update(id, updateData)
        expect(update).toEqual({
            title: 'Software Developer',
            salary: 78000,
            equity: "0.03",
            companyHandle: 'c1'
        })
    })

    test("works: null fields", async function () {
        let results = await db.query(`SELECT id 
                                      FROM jobs
                                      WHERE title = 'Software Engineer'`)
        const id = results.rows[0].id
        const updateDataSetNulls = {
            title: 'Web Developer',
            salary: null,
            equity: null
        };
        const update = await Job.update(id, updateDataSetNulls)
        expect(update).toEqual({
            title: 'Web Developer',
            salary: null,
            equity: null,
            companyHandle: 'c1'
        })
    })

    test("not found if no such job", async function () {
        try {
          const updateData = {
            title: 'Web Developer',
            salary: 70000,
            equity: "0"
        }
          await Job.update(999, updateData);
          fail();
        } catch (err) {
          expect(err instanceof NotFoundError).toBeTruthy();
        }
      });

    test("bad request with no data", async function () {
        try {
          let results = await db.query(`SELECT id 
                                          FROM jobs
                                          WHERE title = 'Software Engineer'`)
          const id = results.rows[0].id
          await Job.update(id, {});
          fail();
        } catch (err) {
          expect(err instanceof BadRequestError).toBeTruthy();
        }
      });
})

/************************************** remove */

describe("remove", function () {
    test("works", async function () {
        let results = await db.query(`SELECT id 
                                      FROM jobs
                                      WHERE title = 'Software Engineer'`)
        const id = results.rows[0].id
        await Job.remove(id)
        const res = await db.query(
            `SELECT id FROM jobs WHERE id=${id}`);
        expect(res.rows.length).toEqual(0);
    })

    test("not found if no such job", async function () {
        try {
            await Job.remove(999)
            fail()
        }
        catch (err) {
            expect(err instanceof NotFoundError).toBeTruthy()
        }
    })
})

/************************************** filterBy */

describe("filterBy", function () {
    test("filter by title", async function () {
           const jobs = await Job.filterBy({title: 'engineer'})
           expect(jobs).toEqual([{
                title: 'Software Engineer',
                salary: 70000,
                equity: "0",
                companyHandle: 'c1'   
           }])
        })
    test("filter by minSalary", async function () {
           const jobs = await Job.filterBy({minSalary: 45000})
           expect(jobs).toEqual([
            {
                title: 'Software Engineer',
                salary: 70000,
                equity: "0",
                companyHandle: 'c1'   
            },
            {
                title: 'Sous Chef',
                salary: 60000,
                equity: "0",
                companyHandle: 'c2' 
            }
        ])
    })
    test ("filter by hasEquity", async function () {
        const jobs = await Job.filterBy({hasEquity: 'true'})
        expect(jobs).toEqual([])
    })
    
    test("filter by all 3", async function () {
        const jobs = await Job.filterBy({title: 'e', minSalary: 45000, hasEquity: 'false'})
        expect(jobs).toEqual([
         {
             title: 'Software Engineer',
             salary: 70000,
             equity: "0",
             companyHandle: 'c1'   
         },
         {
             title: 'Sous Chef',
             salary: 60000,
             equity: "0",
             companyHandle: 'c2' 
         }
     ])
 })
})



     

