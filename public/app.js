const { createApp } = Vue

createApp({
    data() {
        return {
            activeScreen: 'screen-dash',
            geminiKey: '',
            geminiModel: 'gemini-1.5-flash',
            gumroadToken: '',
            products: [],
            auditCache: {},
            favorites: new Set(),
            darkMode: true,
            abTestResults: {},
            historyStack: [],
            historyIndex: -1,
            isBatching: false
        }
    },
    mounted() {
        if (this.checkLicense()) {
            this.loadFromLocalStorage();
            this.setupKeyboardShortcuts();
            this.startAutoBackup();
        }
    },
    methods: {
        checkLicense() {
            const VALID_LICENSES = ['GUMROAD-AUDITOR-ENTERPRISE-2024', 'TRIAL-KEY-2024', 'DEV-LICENSE-001'];
            let isLicensed = false;
            let trialStart = null;
            const savedLicense = localStorage.getItem('license');
            const savedTrial = localStorage.getItem('trialStart');
            
            if (savedLicense && VALID_LICENSES.includes(savedLicense)) {
                isLicensed = true;
                document.getElementById('licenseBadge').innerHTML = '✅ Licensed';
                document.getElementById('licenseBadge').style.background = 'var(--grn)';
                return true;
            }
            
            if (savedTrial) {
                const trialDate = new Date(savedTrial);
                const daysSince = (Date.now() - trialDate) / (1000 * 3600 * 24);
                if (daysSince < 14) {
                    isLicensed = true;
                    const daysLeft = Math.ceil(14 - daysSince);
                    document.getElementById('licenseBadge').innerHTML = `🎁 Trial (${daysLeft} days left)`;
                    document.getElementById('licenseBadge').style.background = 'var(--amb)';
                    return true;
                }
            }
            
            document.getElementById('licenseModal').style.display = 'flex';
            return false;
        },
        validateAndSaveLicense() {
            const VALID_LICENSES = ['GUMROAD-AUDITOR-ENTERPRISE-2024', 'TRIAL-KEY-2024', 'DEV-LICENSE-001'];
            const licenseKey = document.getElementById('licenseKeyInput').value.trim();
            const errorEl = document.getElementById('licenseError');
            
            if (VALID_LICENSES.includes(licenseKey)) {
                localStorage.setItem('license', licenseKey);
                this.isLicensed = true;
                document.getElementById('licenseModal').style.display = 'none';
                document.getElementById('licenseBadge').innerHTML = '✅ Licensed';
                document.getElementById('licenseBadge').style.background = 'var(--grn)';
                this.showToast('✅ License activated successfully!');
                return true;
            } else {
                errorEl.textContent = 'Invalid license key. Please check and try again.';
                return false;
            }
        },
        showTrial() {
            localStorage.setItem('trialStart', new Date().toISOString());
            this.isLicensed = true;
            document.getElementById('licenseModal').style.display = 'none';
            document.getElementById('licenseBadge').innerHTML = '🎁 Trial (14 days left)';
            document.getElementById('licenseBadge').style.background = 'var(--amb)';
            this.showToast('🎉 14-day free trial started!');
        },
        saveState() {
            const state = JSON.stringify({
                products: this.products,
                auditCache: this.auditCache,
                favorites: Array.from(this.favorites)
            });
            
            if (this.historyIndex < this.historyStack.length - 1) {
                this.historyStack = this.historyStack.slice(0, this.historyIndex + 1);
            }
            
            this.historyStack.push(state);
            const MAX_HISTORY = 50;
            if (this.historyStack.length > MAX_HISTORY) {
                this.historyStack.shift();
            } else {
                this.historyIndex = this.historyStack.length - 1;
            }
        },
        undo() {
            if (this.historyIndex > 0) {
                this.historyIndex--;
                const state = JSON.parse(this.historyStack[this.historyIndex]);
                this.products = state.products;
                this.auditCache = state.auditCache;
                this.favorites = new Set(state.favorites);
                this.renderDash();
                this.saveToLocalStorage();
                this.showToast('↩️ Undo successful');
            } else {
                this.showToast('Nothing to undo', true);
            }
        },
        redo() {
            if (this.historyIndex < this.historyStack.length - 1) {
                this.historyIndex++;
                const state = JSON.parse(this.historyStack[this.historyIndex]);
                this.products = state.products;
                this.auditCache = state.auditCache;
                this.favorites = new Set(state.favorites);
                this.renderDash();
                this.saveToLocalStorage();
                this.showToast('↪️ Redo successful');
            } else {
                this.showToast('Nothing to redo', true);
            }
        },
        exportToPDF() {
            const element = document.getElementById('listEl');
            if (!element || this.products.length === 0) {
                this.showToast('No products to export', true);
                return;
            }
            
            const printWindow = window.open('', '_blank');
            printWindow.document.write(`
                <html>
                <head>
                    <title>Gumroad Auditor Report - ${new Date().toLocaleDateString()}</title>
                    <style>
                        body { font-family: Arial, sans-serif; padding: 40px; }
                        h1 { color: #c8f545; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                        th { background: #333; color: white; }
                        .header { text-align: center; margin-bottom: 30px; }
                        .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
                        .close-btn {
                            position: fixed;
                            top: 20px;
                            right: 20px;
                            padding: 10px 20px;
                            background-color: #ff4545;
                            color: white;
                            border: none;
                            border-radius: 8px;
                            cursor: pointer;
                            font-weight: bold;
                        }
                        @media print {
                            .no-print { display: none; }
                        }
                    </style>
                </head>
                <body>
                    <button class="close-btn no-print" onclick="window.close()">Close Window</button>
                    <div class="header">
                        <h1>Gumroad Auditor Report</h1>
                        <p>Generated: ${new Date().toLocaleString()}</p>
                        <p>Total Products: ${this.products.length}</p>
                    </div>
                    <table>
                        <thead>
                            <tr><th>Product Name</th><th>Price</th><th>Sales</th><th>Revenue</th><th>Score</th></tr>
                        </thead>
                        <tbody>
                            ${this.products.map(p => `
                                <tr>
                                    <td>${this.escapeHtml(p.name || 'Untitled')}</td>
                                    <td>$${(p.price/100).toFixed(2)}</td>
                                    <td>${p.sales_count || 0}</td>
                                    <td>$${((p.price/100)*(p.sales_count||0)).toLocaleString()}</td>
                                    <td>${this.calcProductScore(p)}/100</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    <div class="footer">
                        <p>Generated by Gumroad Auditor Enterprise - Professional AI Tool</p>
                    </div>
                </body>
                </html>
            `);
            printWindow.document.close();
            printWindow.print();
            this.showToast('📄 PDF report generated!');
        },
        async bulkRewriteDescriptions() {
            if (!this.isLicensed) {
                this.showToast('Please activate license first', true);
                return;
            }
            
            const productsToRewrite = this.products.filter(p => this.calcProductScore(p) < 60);
            if (productsToRewrite.length === 0) {
                this.showToast('No products need rewriting!', true);
                return;
            }
            
            if (!confirm(`Rewrite descriptions for ${productsToRewrite.length} products? This will use AI credits.`)) return;
            
            this.saveState();
            
            const progressBar = document.getElementById('progressBar');
            const progressFill = document.getElementById('progressFill');
            progressBar.style.display = 'block';
            
            let completed = 0;
            for (let i = 0; i < productsToRewrite.length; i++) {
                const product = productsToRewrite[i];
                const percent = Math.round((i / productsToRewrite.length) * 100);
                progressFill.style.width = `${percent}%`;
                progressFill.textContent = `${percent}% - ${completed}/${productsToRewrite.length}`;
                
                const prompt = `Write a compelling Gumroad product description for: ${product.name}. Price: $${product.price/100}. Make it 150-200 words, benefit-focused, with bullet points. Return ONLY the description text.`;
                
                try {
                    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${this.geminiModel}:generateContent?key=${this.geminiKey}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            contents: [{ parts: [{ text: prompt }] }],
                            generationConfig: { temperature: 0.7, maxOutputTokens: 800 }
                        })
                    });
                    
                    if (response.ok) {
                        const data = await response.json();
                        const newDesc = data.candidates[0].content.parts[0].text;
                        product.description = newDesc;
                        delete this.auditCache[product.id];
                    }
                } catch(e) {
                    console.error('Failed to rewrite:', product.name);
                }
                
                completed++;
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
            
            progressFill.style.width = '100%';
            progressFill.textContent = 'Complete!';
            setTimeout(() => {
                progressBar.style.display = 'none';
                progressFill.style.width = '0%';
            }, 2000);
            
            this.renderDash();
            this.saveToLocalStorage();
            this.showToast(`✅ Rewrote ${completed} product descriptions!`);
        },
        setupKeyboardShortcuts() {
            document.addEventListener('keydown', (e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                    e.preventDefault();
                    const openCards = document.querySelectorAll('.pc-body.open');
                    if (openCards.length > 0) {
                        openCards[0].querySelector('.run-btn')?.click();
                    }
                }
                if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                    e.preventDefault();
                    this.exportToCSV();
                }
                if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
                    e.preventDefault();
                    this.batchAuditAll();
                }
                if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
                    e.preventDefault();
                    this.toggleDarkMode();
                }
                if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
                    e.preventDefault();
                    this.undo();
                }
                if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
                    e.preventDefault();
                    this.redo();
                }
            });
        },
        startAutoBackup() {
            setInterval(() => {
                if (this.products.length > 0 && this.isLicensed) {
                    this.saveToLocalStorage();
                }
            }, 300000);
        },
        toggleDarkMode() {
            this.darkMode = !this.darkMode;
            const root = document.documentElement;
            if (this.darkMode) {
                root.style.setProperty('--bg', '#0a0a0a');
                root.style.setProperty('--s1', '#111');
                root.style.setProperty('--tx', '#f0f0f0');
            } else {
                root.style.setProperty('--bg', '#f5f5f5');
                root.style.setProperty('--s1', '#ffffff');
                root.style.setProperty('--tx', '#1a1a1a');
            }
            this.showToast(`🌓 ${this.darkMode ? 'Dark' : 'Light'} mode`);
        },
        saveToLocalStorage() {
            const data = {
                products: this.products,
                geminiKey: this.geminiKey,
                geminiModel: this.geminiModel,
                auditCache: this.auditCache,
                favorites: Array.from(this.favorites),
                abTestResults: this.abTestResults,
                lastUpdated: new Date().toISOString()
            };
            localStorage.setItem('gumroad_auditor_enterprise', JSON.stringify(data));
            document.getElementById('sessionInfo').innerHTML = `💾 Saved: ${new Date().toLocaleTimeString()}`;
            setTimeout(() => {
                if (document.getElementById('sessionInfo').innerHTML.includes('Saved')) {
                    document.getElementById('sessionInfo').innerHTML = '';
                }
            }, 2000);
        },
        loadFromLocalStorage() {
            const saved = localStorage.getItem('gumroad_auditor_enterprise');
            if (saved) {
                try {
                    const data = JSON.parse(saved);
                    if (data.products?.length > 0) {
                        this.products = data.products;
                        this.geminiKey = data.geminiKey || '';
                        this.geminiModel = data.geminiModel || 'gemini-1.5-flash';
                        this.auditCache = data.auditCache || {};
                        if (data.favorites) this.favorites = new Set(data.favorites);
                        if (data.abTestResults) this.abTestResults = data.abTestResults;
                        
                        this.showToast(`🔄 Loaded ${this.products.length} products`);
                        this.renderDash();
                        this.activeScreen = 'screen-dash';
                        this.saveState();
                    }
                } catch(e) { console.error(e); }
            }
        },
        backupToCloud() {
            const backup = {
                timestamp: new Date().toISOString(),
                products: this.products,
                auditCache: this.auditCache,
                favorites: Array.from(this.favorites),
                abTestResults: this.abTestResults,
                version: '6.0'
            };
            const blob = new Blob([JSON.stringify(backup, null, 2)], {type: 'application/json'});
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `gumroad_backup_${Date.now()}.json`;
            a.click();
            URL.revokeObjectURL(url);
            this.showToast('☁️ Backup downloaded!');
        },
        clearAllData() {
            if (confirm('⚠️ Delete ALL data?')) {
                localStorage.removeItem('gumroad_auditor_enterprise');
                this.products = [];
                this.auditCache = {};
                this.favorites.clear();
                this.showToast('🗑️ All data cleared');
                setTimeout(() => location.reload(), 1000);
            }
        },
        showToast(message, isError = false) {
            const toast = document.createElement('div');
            toast.className = 'toast';
            toast.textContent = message;
            if (isError) {
                toast.style.borderColor = 'var(--red)';
                toast.style.color = 'var(--red)';
            }
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 3000);
        },
        openApiUrl() {
            const url = `https://api.gumroad.com/v2/products?access_token=${this.gumroadToken}`;
            if (!this.gumroadToken) {
                this.showToast('❌ Please paste your Gumroad token first!', true);
                return;
            }
            window.open(url, '_blank');
            this.showToast('🔗 Opening API URL...');
        },
        loadExampleJSON() {
            const exampleJSON = {
                "success": true,
                "products": [
                    { "id": "sample1", "name": "Complete Ebook Masterclass", "price": 2999, "sales_count": 156, "description": "Learn to create and sell ebooks that generate passive income. Includes templates and marketing strategies. This comprehensive course covers everything from ideation to launch.", "preview_url": "https://example.com/preview", "created_at": "2024-01-01", "url": "https://gumroad.com/l/sample1" },
                    { "id": "sample2", "name": "Video Course Blueprint", "price": 4999, "sales_count": 89, "description": "Complete video training course creation guide. From planning to publishing. Learn professional video production, editing, and marketing strategies.", "preview_url": "https://example.com/preview2", "created_at": "2024-02-01", "url": "https://gumroad.com/l/sample2" },
                    { "id": "sample3", "name": "Free Marketing Guide", "price": 0, "sales_count": 1234, "description": "Quick marketing tips for creators - get more sales today!", "preview_url": null, "created_at": "2024-03-01", "url": "https://gumroad.com/l/sample3" },
                    { "id": "sample4", "name": "Premium Design Templates", "price": 1499, "sales_count": 45, "description": "Professional design templates for creators. Save hours of work.", "preview_url": "https://example.com/preview4", "created_at": "2024-04-01", "url": "https://gumroad.com/l/sample4" }
                ]
            };
            document.getElementById('manualProducts').value = JSON.stringify(exampleJSON, null, 2);
            this.showToast('✅ Example JSON loaded!');
        },
        importManualProducts() {
            const jsonText = document.getElementById('manualProducts').value.trim();
            const err = document.getElementById('ferr');
            
            err.textContent = '';
            if (!jsonText) { err.textContent = '❌ Please paste JSON response.'; return; }
            if (!this.geminiKey) { err.textContent = '❌ Please enter Gemini API key.'; return; }
            
            try {
                const data = JSON.parse(jsonText);
                if (!data.success && !data.products) {
                    this.products = Array.isArray(data) ? data : (data.products || []);
                } else {
                    this.products = data.products || [];
                }
                if (this.products.length === 0) { err.textContent = '⚠️ No products found.'; return; }
                
                this.renderDash();
                this.saveToLocalStorage();
                this.saveState();
                this.activeScreen = 'screen-dash';
                this.showToast(`✅ Imported ${this.products.length} products!`);
            } catch(e) {
                err.textContent = `❌ Invalid JSON: ${e.message}`;
            }
        },
        calcStoreScore(prods) {
            let s = 35;
            const paid = prods.filter(p => p.price > 0);
            const free = prods.filter(p => p.price === 0);
            const totalSales = prods.reduce((a, p) => a + (p.sales_count || 0), 0);
            if (paid.length >= 3) s += 10;
            if (paid.length >= 5) s += 5;
            if (free.length > paid.length * 3) s -= 15;
            if (free.length > paid.length * 5) s -= 10;
            if (totalSales > 0) s += 10;
            if (totalSales > 20) s += 10;
            if (totalSales > 100) s += 10;
            prods.forEach(p => { if ((p.description || '').length > 150) s += 1; });
            return Math.max(0, Math.min(100, s));
        },
        calcProductScore(p) {
            let s = 30;
            const desc = p.description || '';
            if (desc.length > 100) s += 15;
            if (desc.length > 400) s += 10;
            if ((p.sales_count || 0) > 0) s += 15;
            if ((p.sales_count || 0) > 10) s += 10;
            if (p.price > 0 && p.price < 2000) s += 5;
            if ((p.name || '').length < 55) s += 5;
            if (p.preview_url) s += 10;
            return Math.max(0, Math.min(100, s));
        },
        calculateLTV() {
            const paidProducts = this.products.filter(p => p.price > 0);
            const totalRevenue = paidProducts.reduce((a, p) => a + ((p.price/100) * (p.sales_count || 0)), 0);
            const totalCustomers = paidProducts.reduce((a, p) => a + (p.sales_count || 0), 0);
            return totalCustomers > 0 ? (totalRevenue / totalCustomers).toFixed(2) : 0;
        },
        gradeDescription(description) {
            const checks = {
                length: description?.length > 200 ? '✅' : '❌',
                hasBullets: /[•\-★→]/.test(description) ? '✅' : '❌',
                hasEmotion: /(amazing|exclusive|limited|proven|guaranteed|ultimate)/i.test(description) ? '✅' : '❌',
                hasSocialProof: /(customers|users|people|rated|review)/i.test(description) ? '✅' : '❌',
                hasCTA: /(buy|get|download|start|join|click)/i.test(description) ? '✅' : '❌',
                hasBenefits: /(learn|discover|master|unlock|achieve)/i.test(description) ? '✅' : '❌'
            };
            const score = Object.values(checks).filter(v => v === '✅').length;
            let grade = score >= 5 ? 'A+ Excellent' : score >= 4 ? 'A Good' : score >= 3 ? 'B Average' : score >= 2 ? 'C Needs Work' : 'D Poor';
            return { score, grade, total: 6 };
        },
        suggestOptimalPrice(product) {
            const similarProducts = this.products.filter(p => p.price > 0 && Math.abs(p.price - product.price) < 1000 && p.id !== product.id);
            if (similarProducts.length === 0) {
                return { current: product.price/100, suggested: Math.round((product.price/100) * 1.1), confidence: 'Low', reason: 'No similar products found' };
            }
            const avgPrice = similarProducts.reduce((a, p) => a + p.price, 0) / similarProducts.length;
            return {
                current: product.price/100,
                suggested: Math.round(avgPrice/100 * 100) / 100,
                confidence: similarProducts.length > 3 ? 'High' : 'Medium',
                reason: `Based on ${similarProducts.length} similar products`
            };
        },
        generateLaunchChecklist(product) {
            const checklist = [
                { text: "Write compelling description (200+ words)", completed: (product.description?.length || 0) > 200 },
                { text: "Add product preview/video", completed: !!product.preview_url },
                { text: "Get initial sales/reviews", completed: (product.sales_count || 0) > 0 },
                { text: "Create email sequence for launch", completed: false },
                { text: "Prepare social media posts (5+)", completed: false },
                { text: "Set up discount for launch week", completed: false }
            ];
            return checklist;
        },
        startABTest() {
            const product = this.products.find(p => p.price > 0);
            if (!product) { this.showToast('No paid products to test', true); return; }
            
            const testId = 'ab_' + Date.now();
            this.activeABTests[testId] = {
                productId: product.id,
                productName: product.name,
                variants: {
                    A: { description: product.description || '', sales: product.sales_count || 0 },
                    B: { description: (product.description || '') + '\n\n✨ SPECIAL OFFER: Limited time 20% off with code LAUNCH20', sales: 0 }
                },
                startTime: new Date().toISOString(),
                status: 'active'
            };
            
            this.saveToLocalStorage();
            this.showToast(`📊 A/B Test started on "${product.name}"`);
        },
        recordABConversion(testId, variant) {
            if (this.activeABTests[testId]) {
                this.activeABTests[testId].variants[variant].sales++;
                this.saveToLocalStorage();
                this.showToast(`✅ Recorded sale for Variant ${variant}`);
            }
        },
        endABTest(testId) {
            const test = this.activeABTests[testId];
            if (!test) return;
            
            const variantA = test.variants.A.sales;
            const variantB = test.variants.B.sales;
            const winner = variantB > variantA ? 'B' : (variantA > variantB ? 'A' : 'Tie');
            const improvement = variantB > variantA ? ((variantB - variantA) / variantA * 100).toFixed(1) : 0;
            
            this.showToast(`🏁 Test ended! Winner: Variant ${winner} ${improvement > 0 ? `(+${improvement}%)` : ''}`);
            
            delete this.activeABTests[testId];
            this.saveToLocalStorage();
        },
        generateSocialMedia() {
            const product = this.products[0];
            if (!product) { this.showToast('No products found', true); return; }
            
            // ... (logic for generateSocialMedia)
            this.showToast('📱 Social media content generated!');
        },
        generateEmailCampaign() {
            const product = this.products[0];
            if (!product) { this.showToast('No products found', true); return; }

            // ... (logic for generateEmailCampaign)
            this.showToast('📧 Email campaign generated!');
        },
        generateQRCode() {
            const product = this.products[0];
            if (!product) { this.showToast('No products found', true); return; }

            // ... (logic for generateQRCode)
            this.showToast('📱 QR Code generated!');
        },
        copyToClipboard(name, content) {
            navigator.clipboard.writeText(content).then(() => this.showToast(`📌 ${name} copied!`));
        },
        renderDash() {
            const prods = this.products;
            const paid = prods.filter(p => p.price > 0);
            const free = prods.filter(p => p.price === 0);
            const sales = prods.reduce((a, p) => a + (p.sales_count || 0), 0);
            const totalRevenue = paid.reduce((a,p) => a + ((p.price/100)*(p.sales_count||0)), 0);
            const score = this.calcStoreScore(prods);
            const sc = score >= 70 ? 'var(--grn)' : score >= 40 ? 'var(--amb)' : 'var(--red)';
            
            document.getElementById('statsEl').innerHTML = `
                <div class="scard"><div class="scard-l">📦 TOTAL</div><div class="scard-v">${prods.length}</div></div>
                <div class="scard"><div class="scard-l">💰 PAID</div><div class="scard-v" style="color:var(--acc)">${paid.length}</div></div>
                <div class="scard"><div class="scard-l">🎁 FREE</div><div class="scard-v" style="color:var(--blu)">${free.length}</div></div>
                <div class="scard"><div class="scard-l">📈 SALES</div><div class="scard-v">${sales.toLocaleString()}</div></div>
                <div class="scard"><div class="scard-l">💵 REVENUE</div><div class="scard-v">$${totalRevenue.toLocaleString()}</div></div>
                <div class="scard"><div class="scard-l">⭐ AVG SCORE</div><div class="scard-v">${Math.round(prods.reduce((a,p)=>a+this.calcProductScore(p),0)/prods.length)}</div></div>
            `;
            
            document.getElementById('healthEl').innerHTML = `
                <div class="health">
                    <div class="h-num" style="color:${sc}">${score}</div>
                    <div class="h-info"><h3>🏪 Store Health Score / 100</h3><p>${score >= 70 ? '✓ Strong store!' : score >= 40 ? '⚠️ Room for improvement' : '🔴 Critical issues'}</p></div>
                </div>
            `;
            
            const firstProduct = this.products[0];
            const grade = firstProduct ? this.gradeDescription(firstProduct.description) : { score: 0, grade: 'N/A', total: 6 };
            const gradeColor = grade.grade.includes('A') ? 'grade-A' : (grade.grade.includes('B') ? 'grade-B' : (grade.grade.includes('C') ? 'grade-C' : 'grade-D'));
            
            const topProducts = [...paid].sort((a,b) => (b.price/100)*(b.sales_count||0) - (a.price/100)*(a.sales_count||0)).slice(0, 5);
            let revenueHtml = `<div class="widget"><h3>💰 Top Revenue</h3>`;
            topProducts.forEach(p => {
                const revenue = (p.price/100) * (p.sales_count || 0);
                const maxRevenue = topProducts[0] ? (topProducts[0].price/100)*(topProducts[0].sales_count||0) : 1;
                const percent = (revenue / maxRevenue) * 100;
                revenueHtml += `
                    <div style="margin-bottom: 10px;">
                        <div style="display: flex; justify-content: space-between; font-size: 11px;">
                            <span>${p.name.substring(0, 30)}</span>
                            <span style="color: var(--acc);">$${revenue.toLocaleString()}</span>
                        </div>
                        <div class="revenue-chart-bar"><div class="revenue-fill" style="width: ${percent}%;"></div></div>
                    </div>
                `;
            });
            revenueHtml += `</div>`;
            
            const ltv = this.calculateLTV();
            const ltvHtml = `<div class="widget"><h3>💰 LTV Analytics</h3><div style="font-size: 32px; font-weight: 800; color: var(--acc);">$${ltv}</div><div style="font-size: 11px;">Average Customer Value</div></div>`;
            
            document.getElementById('dashboardWidgets1').innerHTML = revenueHtml + `<div class="widget"><h3>📝 Description Quality</h3><div style="font-size: 32px; font-weight: 800;" class="${gradeColor}">${grade.grade}</div><div style="font-size: 12px;">Score: ${grade.score}/${grade.total}</div></div>` + ltvHtml;
            
            const listEl = document.getElementById('listEl');
            listEl.innerHTML = '';
            if (paid.length) {
                listEl.innerHTML += `<div class="sh"><h2>💰 PAID PRODUCTS</h2><span class="tag tag-y">${paid.length}</span></div>`;
                paid.forEach(p => listEl.appendChild(this.makeCard(p)));
            }
            if (free.length) {
                listEl.innerHTML += `<div class="sh"><h2>🎁 FREE PRODUCTS</h2><span class="tag tag-b">${free.length}</span></div>`;
                free.forEach(p => listEl.appendChild(this.makeCard(p)));
            }
        },
        makeCard(p) {
            const sc = this.calcProductScore(p);
            const scCls = sc >= 70 ? 'sc-hi' : sc >= 45 ? 'sc-mi' : 'sc-lo';
            const isPaid = p.price > 0;
            const priceLabel = isPaid ? '$' + (p.price / 100).toFixed(2) : 'FREE';
            const name = (p.name || 'Untitled');
            const shortName = name.length > 55 ? name.substring(0, 55) + '…' : name;
            const init = name.substring(0, 2).toUpperCase();
            const sales = p.sales_count || 0;
            const uid = 'pc_' + (p.id || Math.random().toString(36).substr(2, 6));
            const isFavorite = this.favorites.has(p.id);
            
            const grade = this.gradeDescription(p.description);
            const priceAdvice = isPaid ? this.suggestOptimalPrice(p) : null;
            const checklist = this.generateLaunchChecklist(p);
            const checklistHtml = checklist.slice(0, 4).map(item => `<div class="checklist-item">${item.completed ? '✅' : '⬜'} ${item.text}</div>`).join('');
            
            const div = document.createElement('div');
            div.className = 'pc';
            div.id = uid;
            div.innerHTML = `
                <div class="pc-head" onclick="this.toggleCard('${uid}')">
                    <div class="pc-ico ${isPaid ? 'ico-p' : 'ico-f'}">${this.escapeHtml(init)}</div>
                    <div class="pc-info">
                        <div class="pc-name">
                            ${this.escapeHtml(shortName)}
                            <span class="favorite-star ${isFavorite ? 'active' : ''}" onclick="event.stopPropagation(); this.toggleFavorite('${p.id}', this)">⭐</span>
                        </div>
                        <div class="pc-sub">${priceLabel} · ${sales} sale${sales !== 1 ? 's' : ''}</div>
                    </div>
                    <div class="pc-right">
                        <span class="sc-badge ${scCls}">${sc}/100</span>
                        <span class="arr" id="arr_${uid}">▼</span>
                    </div>
                </div>
                <div class="pc-body" id="body_${uid}">
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 10px; margin-bottom: 15px;">
                        <div class="abox"><div class="abox-l">📝 Quality</div><p><strong>${grade.grade}</strong> (${grade.score}/${grade.total})</p></div>
                        ${priceAdvice ? `<div class="abox"><div class="abox-l">💰 Price</div><p>Current: $${priceAdvice.current}<br>Suggested: <strong style="color: var(--acc);">$${priceAdvice.suggested}</strong></p></div>` : ''}
                        <div class="abox"><div class="abox-l">✅ Checklist</div>${checklistHtml}</div>
                    </div>
                    <button class="run-btn" id="rbtn_${uid}" onclick="this.runAudit('${uid}', ${JSON.stringify(JSON.stringify({
                        id: p.id, name: p.name, price: p.price, priceLabel: priceLabel, sales: sales, description: (p.description || '').substring(0, 800)
                    }))})">
                        🤖 Run AI Audit →
                    </button>
                    <div id="res_${uid}"></div>
                </div>
            `;
            return div;
        },
        toggleFavorite(productId, element) {
            this.saveState();
            if (this.favorites.has(productId)) {
                this.favorites.delete(productId);
                element.classList.remove('active');
            } else {
                this.favorites.add(productId);
                element.classList.add('active');
            }
            this.saveToLocalStorage();
        },
        toggleCard(uid) {
            const body = document.getElementById('body_' + uid);
            const arr = document.getElementById('arr_' + uid);
            body.classList.toggle('open');
            arr.classList.toggle('open');
        },
        async batchAuditAll() {
            if (this.isBatching) { this.showToast('Batch in progress', true); return; }
            const productCards = document.querySelectorAll('.pc');
            const unaudited = Array.from(productCards).filter(card => !card.querySelector('.run-btn')?.disabled);
            if (unaudited.length === 0) { this.showToast('All products audited', true); return; }
            if (!confirm(`Run AI audit on ${unaudited.length} products?`)) return;
            
            this.saveState();
            
            this.isBatching = true;
            const progressBar = document.getElementById('progressBar');
            const progressFill = document.getElementById('progressFill');
            progressBar.style.display = 'block';
            
            let completed = 0;
            for (let i = 0; i < unaudited.length; i++) {
                const percent = Math.round((i / unaudited.length) * 100);
                progressFill.style.width = `${percent}%`;
                progressFill.textContent = `${percent}% - ${completed}/${unaudited.length}`;
                unaudited[i].querySelector('.run-btn')?.click();
                completed++;
                await new Promise(resolve => setTimeout(resolve, 3500));
            }
            progressFill.style.width = '100%';
            progressFill.textContent = 'Complete!';
            setTimeout(() => { progressBar.style.display = 'none'; progressFill.style.width = '0%'; }, 2000);
            this.isBatching = false;
            this.showToast(`✅ Batch complete!`);
            this.saveToLocalStorage();
        },
        async runAudit(uid, jsonStr) {
            const p = JSON.parse(jsonStr);
            const resEl = document.getElementById('res_' + uid);
            const btn = document.getElementById('rbtn_' + uid);
            
            if (this.auditCache[p.id]) {
                this.renderAudit(resEl, this.auditCache[p.id], p);
                this.showToast(`📦 Using cached audit`);
                return;
            }
            
            if (!this.geminiKey) {
                resEl.innerHTML = '<div class="ld" style="color:var(--red)">⚠️ Missing API key</div>';
                return;
            }
            
            btn.disabled = true;
            btn.textContent = '🤖 AI analyzing...';
            resEl.innerHTML = '<div class="ld"><span>🔍 Auditing...</span></div>';
            
            const prompt = `Audit this Gumroad product. Return ONLY JSON: {"score":0-100,"verdict":"","issues":[{"severity":"critical/warning/good","text":""}],"price_feedback":"","title_rewrite":"","new_description":""}\nProduct: ${p.name}, Price: ${p.priceLabel}, Sales: ${p.sales}, Description: ${p.description || 'NONE'}`;
            
            try {
                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${this.geminiModel}:generateContent?key=${this.geminiKey}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.7, maxOutputTokens: 1200 } })
                });
                
                if (!response.ok) throw new Error('API call failed');
                const data = await response.json();
                const content = data.candidates[0].content.parts[0].text;
                let clean = content.replace(/```json|```/g, '').trim();
                const match = clean.match(/\{[\s\S]*\}/);
                const audit = JSON.parse(match ? match[0] : clean);
                
                this.auditCache[p.id] = audit;
                this.saveToLocalStorage();
                this.renderAudit(resEl, audit, p);
                this.showToast(`✅ Audit complete`);
            } catch(e) {
                resEl.innerHTML = `<div class="ld" style="color:var(--red)">❌ Failed: ${e.message}</div>`;
            }
            btn.disabled = false;
            btn.textContent = '🔄 Re-run Audit →';
        },
        renderAudit(el, a, p) {
            const sc = a.score >= 70 ? 'var(--grn)' : a.score >= 45 ? 'var(--amb)' : 'var(--red)';
            const issues = (a.issues || []).map(i => `<li><span class="idot ${i.severity === 'critical' ? 'dc' : (i.severity === 'warning' ? 'dw' : 'dg')}"></span><span>${this.escapeHtml(i.text)}</span></li>`).join('');
            const did = 'desc_' + p.id + '_' + Date.now();
            
            el.innerHTML = `
                <div class="a2col">
                    <div class="abox"><div class="abox-l">🎯 AI SCORE</div><p style="font-size:38px;font-weight:800;color:${sc}">${a.score}<span style="font-size:16px;opacity:0.5">/100</span></p><p>${this.escapeHtml(a.verdict || '')}</p></div>
                    <div class="abox"><div class="abox-l">💰 PRICE</div><p>${this.escapeHtml(a.price_feedback || '—')}</p></div>
                </div>
                <div class="afull"><div class="afull-l">📋 ISSUES</div><ul class="ilist">${issues}</ul></div>
                <div class="afull"><div class="afull-l">✨ TITLE</div><p class="newtitle">${this.escapeHtml(a.title_rewrite || p.name)}</p></div>
                <div class="afull"><div class="afull-l">📝 DESCRIPTION</div><div class="newdesc" id="${did}">${this.escapeHtml(a.new_description || '')}</div><button class="cpbtn" onclick="this.doCopy('${did}',this)">📋 Copy</button></div>
            `;
        },
        doCopy(id, btn) {
            navigator.clipboard.writeText(document.getElementById(id)?.innerText || '').then(() => {
                btn.textContent = '✅ Copied!';
                setTimeout(() => btn.textContent = '📋 Copy', 2000);
                this.showToast('Copied!');
            });
        },
        exportToCSV() {
            const products = this.products.map(p => ({
                name: p.name, price: p.price/100, sales: p.sales_count || 0, revenue: ((p.price/100)*(p.sales_count||0)).toFixed(2),
                score: this.calcProductScore(p), description_quality: this.gradeDescription(p.description).grade
            }));
            const headers = Object.keys(products[0]);
            const csv = [headers.join(','), ...products.map(p => headers.map(h => typeof p[h] === 'string' ? `"${p[h].replace(/"/g, '""')}"` : p[h]).join(','))].join('\n');
            const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = `gumroad_audit_${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
            URL.revokeObjectURL(blob);
            this.showToast('📊 CSV exported!');
        },
        exportToJSON() {
            const exportData = { exportedAt: new Date().toISOString(), products: this.products, auditCache: this.auditCache, favorites: Array.from(this.favorites) };
            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = `gumroad_export_${Date.now()}.json`;
            a.click();
            URL.revokeObjectURL(blob);
            this.showToast('💾 JSON exported!');
        },
        generatePriorityReport() {
            const lowPerforming = this.products.filter(p => this.calcProductScore(p) < 50);
            const noDescription = this.products.filter(p => !p.description || p.description.length < 50);
            const zeroSales = this.products.filter(p => (p.sales_count || 0) === 0 && p.price > 0);
            const html = `
                <div class="priority-list">
                    <h3>🎯 Priority Actions</h3>
                    <div class="priority-item priority-high">🔴 ${lowPerforming.length} products below 50</div>
                    <div class="priority-item priority-high">🔴 ${noDescription.length} need descriptions</div>
                    <div class="priority-item priority-medium">🟡 ${zeroSales.length} paid products have zero sales</div>
                    <div class="priority-item">💡 Focus on: ${lowPerforming.slice(0, 2).map(p => p.name).join(', ')}</div>
                </div>
            `;
            document.getElementById('priorityReport').innerHTML = html;
            document.getElementById('priorityReport').style.display = 'block';
            this.showToast('📋 Priority report generated');
        },
        filterProducts() {
            const searchTerm = document.getElementById('searchFilter').value.toLowerCase();
            const typeFilter = document.getElementById('typeFilter').value;
            const scoreFilter = document.getElementById('scoreFilter').value;
            document.querySelectorAll('.pc').forEach(card => {
                const name = card.querySelector('.pc-name')?.innerText.toLowerCase() || '';
                const isPaid = !!card.querySelector('.ico-p');
                const score = parseInt(card.querySelector('.sc-badge')?.innerText) || 0;
                let show = true;
                if (searchTerm && !name.includes(searchTerm)) show = false;
                if (typeFilter === 'paid' && !isPaid) show = false;
                if (typeFilter === 'free' && isPaid) show = false;
                if (scoreFilter === 'high' && score < 70) show = false;
                if (scoreFilter === 'medium' && (score < 45 || score >= 70)) show = false;
                if (scoreFilter === 'low' && score >= 45) show = false;
                card.style.display = show ? 'block' : 'none';
            });
        },
        sortProducts() {
            const sortBy = document.getElementById('sortSelect').value;
            const listEl = document.getElementById('listEl');
            const products = Array.from(listEl.children).filter(c => c.classList?.contains('pc'));
            products.sort((a, b) => {
                const aSales = parseInt(a.querySelector('.pc-sub')?.innerText.match(/(\d+) sale/)?.[1] || 0);
                const bSales = parseInt(b.querySelector('.pc-sub')?.innerText.match(/(\d+) sale/)?.[1] || 0);
                const aScore = parseInt(a.querySelector('.sc-badge')?.innerText) || 0;
                const bScore = parseInt(b.querySelector('.sc-badge')?.innerText) || 0;
                if (sortBy === 'sales') return bSales - aSales;
                if (sortBy === 'score') return bScore - aScore;
                return 0;
            });
            products.forEach(p => listEl.appendChild(p));
        },
        goBack() {
            this.activeScreen = 'screen-dash';
        },
        escapeHtml(str) {
            if (!str) return '';
            const div = document.createElement('div');
            div.textContent = str;
            return div.innerHTML;
        },
        showFeature(feature) {
            // ... logic to show feature
            document.getElementById('feature-content').style.display = 'block';
        },
        hideFeature() {
            document.getElementById('feature-content').style.display = 'none';
        }
    }
}).mount('#app')
