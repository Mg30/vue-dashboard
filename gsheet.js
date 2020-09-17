/**
 * Provide utilies function to fetch data from a google sheet id
 */

class Gsheet {
    constructor(sheetId, apiKey) {
        this.sheetId = sheetId
        this.apiKey = apiKey
        this.sheets = {}
        this.data = []
    }

    async fetch(){
        this.sheets = await this.extract()
        this.transform()
        return this.data
    }

    async extract () {
        return new Promise(async (resolve, reject) => {
            const { data } = await axios.get(
                `https://sheets.googleapis.com/v4/spreadsheets/${this.sheetId}?key=${this.apiKey}&includeGridData=true`
            )
            
            resolve(data.sheets)
        })

    }

    transform () {
        this.data = this.sheets.reduce((acc, sheet) => {
            const title = sheet.properties.title
            const data = this.parse(sheet)
            acc[title] = data
            return acc
        }, {})

    }

    parse (sheet) {
        const headers = this.extractHeadersFrom(sheet.data)
        let data = sheet.data[0].rowData.slice(1)
        let cleaned = []
        data.forEach((row) => {
            const rowCleaned = this.extractDataFrom(row, headers)
            cleaned.push(rowCleaned)
        })
        return cleaned

    }

    extractHeadersFrom (sheetData) {
        return sheetData[0].rowData[0].values.map(v => v.formattedValue).filter(v => v !== undefined)
    }

    extractDataFrom (row, headers) {
        if (row.values.length !== headers.length) {
            row.values.push({
                formattedValue: null
            })
        }

        return row.values.reduce((acc, v, colIndex) => {
            try {
                const col = headers[colIndex]
                const data = v.formattedValue
                if (col !== undefined) {
                    const isNumber = !isNaN(data)
                    const isUndefined = data === undefined
                    if (isNumber && !isUndefined) {
                        acc[col] = +data
                    } else if (!isNumber && !isUndefined) {
                        acc[col] = data
                    } else {
                        acc[col] = null
                    }
                }
            } catch (error) { }
            return acc
        }, {})
    }

}