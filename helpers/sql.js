const { BadRequestError, ExpressError } = require("../expressError");

/* Helper function for wrtiting SQL to partially update SQL table entry 
 * (so user doesn't need to input data for the columns they don't wish to update). 
 *
 * Input:
 * dataToUpdate: Object with model data to update: 
 * {firstName: John, lastName: Smith}
 * jsToSql: Object with keys as column names in Javascript format and values as column names in SQL format:
 *  {firstName: first_name, lastName: last_name}
 * (Properties with only one word will stay the same and don't need to be included)
 *
 * Output:
 *  { 
 *   setCols: '"first_name"  = $1, "last_name" = $2',
 *   values: ["John", "Smith"]
 *  } */
function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map((colName, idx) =>
      `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

  /* Function to build WHERE SQL statement in order to filter companies by name, minEmployees, and maxEmployees.
   * Input: 
   * dataToFilterBy: {name: 'gray", minEmployees: 45, maxEmployees: 100} 
   * - any of these values can be undefined. 
   * Output:
   * {
   *  partialQuery: `name ~* $1 AND num_employees >= $2 AND num_employees <= $3`,
   *  vals: ['gray', 45, 100]
   * } */
    function sqlForWhereStatement(dataToFilterBy) {
      const d = dataToFilterBy
      let partialQuery = []
      // Check that minEmployees is less than maxEmployees
      if (d.minEmployees && d.maxEmployees) {
        if (+d.minEmployees > +d.maxEmployees) {
          throw new ExpressError("minEmployees cannot be greater than maxEmployees", 400)
        }
      }
      // Get parts of WHERE statement
      let idx = 0;
      let vals = []
      for (let key in d) {
        if (d[key] !== undefined) { 
          if (key === 'name') {
            idx++
            partialQuery.push(`name ~* $${idx}`)
            vals.push(d[key])
          }
          if (key === 'minEmployees') {
            idx++
            partialQuery.push(`num_employees >= $${idx}`) 
            vals.push(+d[key])
          }
          if (key === 'maxEmployees') {
            idx++
            partialQuery.push(`num_employees <= $${idx}`) 
            vals.push(+d[key])
          }
        }
      }
      partialQuery = partialQuery.join(' AND ')
      return {partialQuery, vals}
    }

module.exports = { sqlForPartialUpdate, sqlForWhereStatement};
