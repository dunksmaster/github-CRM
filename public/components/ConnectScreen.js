export default {
    template: `
        <div id="screen-connect" class="screen" :class="{ active: activeScreen === 'screen-connect' }">
            <div class="connect">
                <div class="success-box" style="margin-bottom: 1rem; background: rgba(61,220,122,0.1); border-color: var(--grn); padding: 12px; border-radius: 8px;">
                    🚀 <strong>Gumroad Auditor Enterprise v7.0</strong> — Vue.js Refactor
                </div>
                
                <span class="field-label">🤖 GOOGLE GEMINI API KEY <span class="free-badge">FREE TIER</span></span>
                <div class="inp-row">
                    <input class="inp" type="password" placeholder="AIzaSy..." v-model="geminiKey"/>
                    <select class="model-select" v-model="geminiModel">
                        <option value="gemini-1.5-flash">Gemini 1.5 Flash (Fast & Free)</option>
                        <option value="gemini-1.5-pro">Gemini 1.5 Pro (More detailed)</option>
                    </select>
                </div>
                <p class="hint">🆓 Get your free key at <a href="https://aistudio.google.com/apikey" target="_blank">Google AI Studio</a></p>
                
                <div class="manual-import">
                    <div class="field-label">📦 GET YOUR GUMROAD DATA</div>
                    <div class="token-input-group">
                        <label>🔑 Your Gumroad Access Token:</label>
                        <div class="inp-row">
                            <input class="inp" type="password" placeholder="Paste your Gumroad access token here..." v-model="gumroadToken" @input="$emit('update:gumroadToken', $event.target.value)" />
                        </div>
                    </div>
                    <div class="api-url-box">
                        <input type="text" class="api-url-input" :value="apiUrl" readonly style="background: var(--bg); flex:1;" />
                        <button class="open-tab-btn" @click="openApiUrl">🔗 Open API URL</button>
                    </div>
                    <div class="field-label">📋 PASTE JSON RESPONSE HERE</div>
                    <textarea rows="5" placeholder='Paste your Gumroad API JSON response here...' v-model="jsonText"></textarea>
                    <div class="inp-row" style="margin-top: 12px;">
                        <button class="go-btn" style="flex: 1;" @click="importProducts">📥 Import Products</button>
                        <button class="go-btn secondary-btn" @click="$emit('load-saved')">💾 Load Last Session</button>
                    </div>
                    <button class="action-btn" style="margin-top: 10px; width: 100%;" @click="loadExample">📝 Load Example JSON</button>
                </div>
                <p class="ferr" v-if="error">{{ error }}</p>
            </div>
        </div>
    `,
    props: ['activeScreen', 'gumroadToken', 'geminiKey', 'geminiModel'],
    emits: ['update:gumroadToken', 'update:geminiKey', 'update:geminiModel', 'products-imported', 'load-saved', 'show-toast'],
    data() {
        return {
            jsonText: '',
            error: ''
        }
    },
    computed: {
        apiUrl() {
            return `https://api.gumroad.com/v2/products?access_token=${this.gumroadToken}`;
        }
    },
    methods: {
        openApiUrl() {
            if (!this.gumroadToken) {
                this.$emit('show-toast', '❌ Please paste your Gumroad token first!', true);
                return;
            }
            window.open(this.apiUrl, '_blank');
            this.$emit('show-toast', '🔗 Opening API URL...');
        },
        loadExample() {
            const exampleJSON = {
                "success": true,
                "products": [
                    { "id": "sample1", "name": "Complete Ebook Masterclass", "price": 2999, "sales_count": 156, "description": "Learn to create and sell ebooks...", "url": "https://gumroad.com/l/sample1" },
                    { "id": "sample2", "name": "Video Course Blueprint", "price": 4999, "sales_count": 89, "description": "Complete video training guide...", "url": "https://gumroad.com/l/sample2" },
                    { "id": "sample3", "name": "Free Marketing Guide", "price": 0, "sales_count": 1234, "description": "Quick marketing tips...", "url": "https://gumroad.com/l/sample3" }
                ]
            };
            this.jsonText = JSON.stringify(exampleJSON, null, 2);
            this.$emit('show-toast', '✅ Example JSON loaded!');
        },
        importProducts() {
            this.error = '';
            if (!this.jsonText) {
                this.error = '❌ Please paste JSON response.';
                return;
            }
            if (!this.geminiKey) {
                this.error = '❌ Please enter Gemini API key.';
                return;
            }

            try {
                const data = JSON.parse(this.jsonText);
                let products = [];
                if (!data.success && !data.products) {
                    products = Array.isArray(data) ? data : (data.products || []);
                } else {
                    products = data.products || [];
                }

                if (products.length === 0) {
                    this.error = '⚠️ No products found.';
                    return;
                }

                this.$emit('products-imported', products);

            } catch (e) {
                this.error = `❌ Invalid JSON: ${e.message}`;
            }
        }
    }
}
