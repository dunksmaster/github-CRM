export default {
    template: `
        <div id="screen-dash" class="screen" :class="{ active: activeScreen === 'screen-dash' }">
            <div class="hdr">
                <div class="hdr-top">
                    <div>
                        <h1>Dashboard</h1>
                    </div>
                    <div style="font-size: 11px; color: var(--mu);">{{ sessionInfo }}</div>
                </div>
                <p>An overview of your Gumroad products and store health.</p>
            </div>
            <div class="stats" v-html="statsEl"></div>
            <div v-html="healthEl"></div>
            
            <div class="dashboard-grid" v-html="dashboardWidgets1"></div>
            
            <div class="filter-bar">
                <input type="text" class="filter-input" placeholder="🔍 Search..." v-model="searchFilter" @keyup="filterProducts">
                <select class="filter-input" v-model="typeFilter" @change="filterProducts">
                    <option value="all">All Products</option>
                    <option value="paid">Paid Only</option>
                    <option value="free">Free Only</option>
                </select>
                <select class="filter-input" v-model="scoreFilter" @change="filterProducts">
                    <option value="all">All Scores</option>
                    <option value="high">High (70+)</option>
                    <option value="medium">Medium (45-69)</option>
                    <option value="low">Low (0-44)</option>
                </select>
                <select class="sort-select" v-model="sortSelect" @change="sortProducts">
                    <option value="default">Sort by: Default</option>
                    <option value="sales">Sort by: Sales</option>
                    <option value="revenue">Sort by: Revenue</option>
                    <option value="score">Sort by: Score</option>
                </select>
            </div>
            
            <div v-html="priorityReport" v-if="priorityReport"></div>
            <div id="listEl">
                <div v-if="filteredProducts.length">
                    <div class="sh" v-if="paidProducts.length"><h2>💰 PAID PRODUCTS</h2><span class="tag tag-y">{{ paidProducts.length }}</span></div>
                    <product-card v-for="product in paidProducts" :key="product.id" :product="product" @run-audit="runAudit" />
                    <div class="sh" v-if="freeProducts.length"><h2>🎁 FREE PRODUCTS</h2><span class="tag tag-b">{{ freeProducts.length }}</span></div>
                    <product-card v-for="product in freeProducts" :key="product.id" :product="product" @run-audit="runAudit" />
                </div>
            </div>
        </div>
    `,
    props: ['activeScreen', 'products', 'auditCache', 'sessionInfo'],
    data() {
        return {
            searchFilter: '',
            typeFilter: 'all',
            scoreFilter: 'all',
            sortSelect: 'default',
            filteredProducts: []
        }
    },
    computed: {
        statsEl() { /* ... computed property to generate stats HTML ... */ return '...'; },
        healthEl() { /* ... computed property to generate health HTML ... */ return '...'; },
        dashboardWidgets1() { /* ... computed property to generate widgets HTML ... */ return '...'; },
        priorityReport() { /* ... computed property to generate report HTML ... */ return '...'; },
        paidProducts() {
            return this.filteredProducts.filter(p => p.price > 0);
        },
        freeProducts() {
            return this.filteredProducts.filter(p => p.price === 0);
        }
    },
    methods: {
        filterProducts() { /* ... logic to filter products ... */ },
        sortProducts() { /* ... logic to sort products ... */ },
        runAudit(product) {
            this.$emit('run-audit', product);
        }
    },
    watch: {
        products: {
            handler() {
                this.filteredProducts = this.products;
                this.filterProducts();
            },
            immediate: true
        }
    },
    components: {
        // 'product-card': ProductCard // Will be defined later
    }
}
