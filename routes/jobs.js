"use strict";

/** Routes for jobs. */

const jsonschema = require("jsonschema");
const express = require("express");

const { BadRequestError } = require("../expressError");
const { ensureLoggedIn, ensureAdmin } = require("../middleware/auth");
const Job = require("../models/job");

const jobNewSchema = require("../schemas/jobNew.json");
const jobUpdateSchema = require("../schemas/jobUpdate.json");

const router = new express.Router();

/** POST / { job } =>  { job }
 *
 * Job should be { title, salary, equity, companyHandle }
 *
 * Returns { title, salary, equity, companyHandle }
 *
 * Authorization required: admin
 */

router.post('/', ensureAdmin, async function (req, res, next) {
    // Might be nice to validate companyHandle here
    try {
        const validator = jsonschema.validate(req.body, jobNewSchema);
        if (!validator.valid) {
          const errs = validator.errors.map(e => e.stack);
          throw new BadRequestError(errs);
        }
    
        const job = await Job.create(req.body);
        return res.status(201).json({ job });
      } catch (err) {
        return next(err);
      }
})

/** GET /  =>
 *   { jobs: [ { title, salary, equity, companyHandle }, ...] }
 *
 * Can filter on provided search filters:
 *
 * Authorization required: none
 */

router.get('/', async function (req,res,next) {
    // will add filtering option
    try {
        let { title, minSalary, hasEquity } = req.query
        // if any params to filter by, use Company.filterBy
        let jobs = (title || minSalary || hasEquity === 'true') 
                    ? await Job.filterBy({title, minSalary, hasEquity})
                    : await Job.findAll();
        return res.json({ jobs });
        }
       catch (err) {
        return next(err);
      }
})

/** GET /[id]  =>  { job }
 *
 *  Job is { title, salary, equity, companyHandle }
 *
 * Authorization required: none
 */

router.get("/:id", async function (req, res, next) {
    try {
      const job = await Job.get(req.params.id);
      return res.json({ job });
    } catch (err) {
      return next(err);
    }
  });

/** PATCH /[id] { fld1, fld2, ... } => { job }
 *
 * Patches job data.
 *
 * fields can be: { title, salary, equity }
 *
 * Returns { title, salary, equity, companyHandle }
 *
 * Authorization required: admin
 */

router.patch('/:id', ensureAdmin, async function (req, res, next) {
    try {
        const validator = jsonschema.validate(req.body, jobUpdateSchema);
        if (!validator.valid) {
          const errs = validator.errors.map(e => e.stack);
          throw new BadRequestError(errs);
        }
    
        const job = await Job.update(req.params.id, req.body);
        return res.json({ job });
      } catch (err) {
        return next(err);
      }
})

/** DELETE /[id]  =>  { deleted: id }
 *
 * Authorization: admin
 */

router.delete('/:id', ensureAdmin, async function (req,res,next) {
    try {
        await Job.remove(req.params.id);
        return res.json({ deleted: req.params.id });
      } catch (err) {
        return next(err);
      }
})

module.exports = router;