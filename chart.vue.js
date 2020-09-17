var chart = Vue.component("Chart", {
    template: `
    <v-card >
        <v-toolbar dense flat  class="text subtitle-1">
            <v-toolbar-title>{{title}}</v-toolbar-title>
            <v-spacer></v-spacer>
            <v-chip v-for="(value,key,index) in filter" :key="index" :close="index === (Object.keys(filter).length -1)" @click:close="goUp(key)">
            {{key + ':' + value}}

          </v-chip>
          <v-spacer></v-spacer>
          <v-tooltip bottom>
          <template v-slot:activator="{ on, attrs }">
          <v-btn icon :color="color" @click="drill = !drill" v-bind="attrs"
          v-on="on">
          <v-icon>mdi-arrow-down-bold</v-icon>
        </v-btn>
          </template>
          <span>{{ !!drill ? 'Disable drill down': 'Enable drill down' }}</span>
        </v-tooltip>

        </v-toolbar>
        <component :is="chart" v-bind="chartProperties"></component>
</v-card>
    `,
    props: {
        'data': {
            type: Array,
            required: true
        },
        'type': {
            type: String,
            required: true
        },
        'hierarchy': {
            type: Array,
            required: true,
            default: []
        },
        'metrics': {
            type: Array,
            required: true,
            default: []
        }
        , 'title': {
            type: String,
            required: true
        },
        settings: {
            type: Object,
            default: {}
        }

    },
    mounted () {
        this.drillValues = [...this.hierarchy]
    },
    data () {
        return {
            drillValues: [],
            nextlevel: '',
            drill: false,
            filter: {},
        }
    },
    methods: {
        buildData (dimension, metrics) {
            let rows = this.data
            if (!_.isEmpty(this.filter)) {
                rows = _.filter(rows, this.filter)
            }
            rows = _.groupBy(rows, dimension)
            rows = Object.keys(rows).reduce((acc, key) => {
                const item = metrics.reduce((obj, metric) => {
                    obj[metric] = _.sumBy(rows[key], metric)
                    return obj
                }, {})

                item[dimension] = key
                acc.push(item)
                return acc
            }, [])
            const formattedData = {
                columns: [dimension, ...metrics],
                rows
            }
            return formattedData
        },
        goUp (event) {
            this.filter = _.omit(this.filter, event)
            this.drillValues.unshift(event)
        }
    },
    computed: {
        chart () {
            return `ve-${this.type}`
        },
        color () {
            if (!this.drill) {
                return 'green'
            }
            else {
                return 'red'
            }

        },
        chartEvent () {
            if (this.drill) {
                return {
                    click: (e) => {
                        const name = isNaN(+e.name) ? e.name : +e.name
                        this.nextlevel = this.drillValues.shift()
                        this.filter[this.nextlevel] = name
                        if (_.isEmpty(this.drillValues)) {
                            this.filter = {}
                            this.drillValues = [...this.hierarchy]
                        }
                    }
                }
            }
            else {
                return {
                    click: (e) => {
                        const name = isNaN(+e.name) ? e.name : +e.name
                        this.$emit('clicked', name)
                    }
                }
            }
        },
        chartProperties () {
            const data = this.buildData(this.drillValues[0], this.metrics)
            return {
                data,
                settings: {
                    dimensions: [this.drillValues[0]],
                    metrics: this.metrics,
                    ...this.settings
                },
                events: this.chartEvent
            }
        }

    }
},
)