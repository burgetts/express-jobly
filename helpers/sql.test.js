const { sqlForPartialUpdate, sqlForCompanyWhereStatement, sqlForJobWhereStatement } = require('./sql')
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

describe("test sqlForCompanyWhereStatement", () => {
    test("returns correct output - all 3 params", () => {
        let dataToFilterBy = {name: 'gray', minEmployees: 45, maxEmployees: 100}
        let result = sqlForCompanyWhereStatement(dataToFilterBy)
        expect(result).toEqual({
                                partialQuery: "name ~* $1 AND num_employees >= $2 AND num_employees <= $3", 
                                vals: ["gray", 45, 100]
                            })
    })
    test("returns correct output - 2 params", () => {
        let dataToFilterBy = {name: 'gray', minEmployees: 45}
        let result = sqlForCompanyWhereStatement(dataToFilterBy)
        expect(result).toEqual({
                                partialQuery: "name ~* $1 AND num_employees >= $2",
                                vals: ["gray", 45]
                            })
    })
    test("returns correct output - 1 param", () => {
        let dataToFilterBy = {minEmployees: 45}
        let result = sqlForCompanyWhereStatement(dataToFilterBy)
        expect(result).toEqual({
                                partialQuery: "num_employees >= $1", 
                                vals: [45]
                                })
    })
    test("returns error if min > max employees", () => {
        try {
            let dataToFilterBy = {minEmployees:10, maxEmployees:1}
            let result = sqlForCompanyWhereStatement(dataToFilterBy)
        } catch (e) {
            expect(e.message).toEqual('minEmployees cannot be greater than maxEmployees')
        } 
    })
})

describe("sqlForJobWhereStatement", function () {
    test("returns correct output - all three params (hasEquity: true)", () => {
        let dataToFilterBy = {title: 'engineer', minSalary: 70000, hasEquity: 'true' }
        let result = sqlForJobWhereStatement(dataToFilterBy)
        expect(result).toEqual({
            partialQuery: "title ~* $1 AND salary >= $2 AND equity != '0'",
            vals: ['engineer', 70000]

        })
    })
    test("returns correct output - all three params (hasEquity: false)", () => {
        let dataToFilterBy = {title: 'engineer', minSalary: 70000, hasEquity: 'false' }
        let result = sqlForJobWhereStatement(dataToFilterBy)
        expect(result).toEqual({
            partialQuery: "title ~* $1 AND salary >= $2",
            vals: ['engineer', 70000]
        })
    })
    test("returns correct output - all three params (hasEquity: invalid)", () => {
        let dataToFilterBy = {title: 'engineer', minSalary: 70000, hasEquity: 'sdfsdfsdf' }
        let result = sqlForJobWhereStatement(dataToFilterBy)
        expect(result).toEqual({
            partialQuery: "title ~* $1 AND salary >= $2",
            vals: ['engineer', 70000]
        })
    })
    test("returns correct output - title only", () => {
        let dataToFilterBy = {title: 'ist' }
        let result = sqlForJobWhereStatement(dataToFilterBy)
        expect(result).toEqual({
            partialQuery: "title ~* $1",
            vals: ['ist']
        })
    })
})