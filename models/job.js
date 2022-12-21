"use strict";

const db = require("../db");
const { ExpressError, BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate, sqlForJobWhereStatement } = require("../helpers/sql");

/** Related functions for jobs. */

class Job {

  /** Create a job (from data), update db, return new job data.
   *
   * data should be { title, salary, equity, companyHandle }
   *
   * Returns { title, salary, equity, companyHandle }
   * 
   * */

    static async create({title, salary, equity, companyHandle}) {
        const result = await db.query(
            `INSERT INTO jobs
             (title, salary, equity, company_handle)
             VALUES ($1, $2, $3, $4)
             RETURNING title, salary, equity, company_handle AS "companyHandle"`,
          [
            title,
            salary,
            equity,
            companyHandle
          ],
      );
      const job = result.rows[0]
      return job
    }

  /** Find all jobs.
   *
   * Returns [{ title, salary, equity, companyHandle }, ...]
   * */

    static async findAll() {
        const jobsRes = await db.query(`
            SELECT title, salary, equity, company_handle AS "companyHandle" 
            FROM jobs
            ORDER BY title`)
        return jobsRes.rows
    }
    
  /** Given a job id, return data about the job.
   *
   * Returns { title, salary, equity, companyHandle }
   *
   * Throws NotFoundError if not found.
   **/

    static async get(id) {
        const jobRes = await db.query(
            `SELECT title,
                    salary,
                    equity,
                    company_handle AS "companyHandle"
             FROM jobs
             WHERE id = $1`,
          [id]);
        
        const job = jobRes.rows[0]
        if (!job) throw new NotFoundError(`Not found: job with id: ${id}`)

        return job
    }

  /** Update job data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {title, salary, equity}
   *
   * Returns { title, salary, equity, companyHandle }
   *
   * Throws NotFoundError if not found.
   */

    static async update(id, data) {
        const { setCols, values } = sqlForPartialUpdate(
            data,
            {
              // companyHandle: "company_handle",
            });

        const idVarIdx = "$" + (values.length + 1);
    
        const querySql = `UPDATE jobs
                          SET ${setCols} 
                          WHERE id = ${idVarIdx} 
                          RETURNING title, 
                                    salary, 
                                    equity, 
                                    company_handle AS "companyHandle"`;

        const result = await db.query(querySql, [...values, id]);
        const job = result.rows[0];
    
        if (!job) throw new NotFoundError(`No job found with id: ${id}`);
    
        return job;
    }
   
  /** Delete given job from database; returns undefined.
   *
   * Throws NotFoundError if job not found.
   */
    
    static async remove(id) {
        const result = await db.query(
            `DELETE
             FROM jobs
             WHERE id = $1
             RETURNING id`,
          [id]);

      const job= result.rows[0];
  
      if (!job) throw new NotFoundError(`No job found with id: ${id}`);
   }

  /* Filter job data by title, minSalary, and hasEquity. 
   * dataToFilter by can look like: {title: 'engineer', minSalary: 40000, hasEquity: 'true'} 
   * Title is case insensitive, partial match. */

   static async filterBy(dataToFilterBy) {
    let {partialQuery, vals} = sqlForJobWhereStatement(dataToFilterBy)
    console.log(partialQuery, vals)
    let resp = await db.query(`SELECT title,
                               salary,
                               equity,
                               company_handle AS "companyHandle"
                               FROM jobs
                               WHERE ${partialQuery}`, [...vals])
    return resp.rows
   }
}

module.exports = Job;
