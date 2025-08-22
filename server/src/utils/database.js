export function database_single_query(database, query, params) {
    return new Promise((resolve, reject) => {
        database.query(query, params, (error, results) => {
            if (error) {
                reject(error)
            } else {
                resolve(!results || results.length === 0 ? null : results[0])
            }
        })
    })
}

export function database_multiple_query(database, query, params) {
    return new Promise((resolve, reject) => {
        database.query(query, params, (error, results) => {
            if (error) {
                reject(error)
            } else {
                resolve(results)
            }
        })
    })
}