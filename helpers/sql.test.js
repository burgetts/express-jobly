const { sqlForPartialUpdate, sqlForWhereStatement } = require('./sql')
const {BadRequestError} = require('../expressError')

describe("test sqlForPartialUpdate", () => {
    test("returns correct output", () => {
        let dataToUpdate = {firstName: "John", lastName: "Smith"}
        let jsToSql = {firstName: "first_name", lastName: "last_name"}

        let data = sqlForPartialUpdate(dataToUpdate, jsToSql)
        expect(data).toEqual({
            setCols: `"first_name"=$1, "last_name"=$2`, 
            values: ["John", "Smith"]
        })
    })
    test("returns BadRequestError if no data provided", () => {
        let jsToSql = {firstName: "first_name", lastName: "last_name"}
        expect(() => {
            sqlForPartialUpdate({}, jsToSql)
        }).toThrow(BadRequestError)
    })
})

describe("test sqlForWhereStatement", () => {
    test("returns correct output - all 3 params", () => {
        let dataToFilterBy = {name: 'gray', minEmployees: 45, maxEmployees: 100}
        let result = sqlForWhereStatement(dataToFilterBy)
        expect(result).toEqual({
                                partialQuery: "name ~* $1 AND num_employees >= $2 AND num_employees <= $3", 
                                vals: ["gray", 45, 100]
                            })
    })
    test("returns correct output - 2 params", () => {
        let dataToFilterBy = {name: 'gray', minEmployees: 45}
        let result = sqlForWhereStatement(dataToFilterBy)
        expect(result).toEqual({
                                partialQuery: "name ~* $1 AND num_employees >= $2",
                                vals: ["gray", 45]
                            })
    })
    test("returns correct output - 1 param", () => {
        let dataToFilterBy = {minEmployees: 45}
        let result = sqlForWhereStatement(dataToFilterBy)
        expect(result).toEqual({
                                partialQuery: "num_employees >= $1", 
                                vals: [45]
                                })
    })
    test("returns error if min > max employees", () => {
        try {
            let dataToFilterBy = {minEmployees:10, maxEmployees:1}
        } catch (e) {
            expect(e.message).toEqual('minEmployees cannot be greater than maxEmployees')
        } 
    })
})