// ── View Manager ─────────────────────────────────────────────────────────────
const ViewManager = (() => {
    const VIEWS = ['kg', 'temporal', 'network', 'barchart', 'analytics', 'timeline'];
    let activeView       = 'kg';
    let initializedViews = new Set();
    let sharedData       = null;
    let sharedKG         = null;

    const viewInitializers = {
        kg:        () => {
            KGView.initialize(sharedKG);
            KGSearch.initialize(sharedKG);
        },
        temporal:  () => Visualization.initialize(sharedData),
        network:   () => NetworkGraph.initialize(sharedData),
        barchart:  () => BarChart.initialize(sharedData),
        analytics: () => Analytics.initialize(sharedData),
        timeline:  () => Timeline.initialize(sharedData)
    };

    const switchTo = (viewId) => {
        if (viewId === activeView && initializedViews.has(viewId)) return;
        activeView = viewId;

        VIEWS.forEach(v => {
            document.getElementById(`view-${v}`)?.classList.toggle('active', v === viewId);
            const tab = document.getElementById(`tab-${v}`);
            if (tab) {
                tab.classList.toggle('active', v === viewId);
                tab.setAttribute('aria-selected', String(v === viewId));
            }
        });

        const legend   = document.getElementById('temporal-legend');
        const resetBtn = document.getElementById('reset-zoom');
        const focusBtn = document.getElementById('kg-focus-mode');
        if (legend)   legend.style.display  = viewId === 'temporal' ? 'flex'  : 'none';
        if (resetBtn) resetBtn.style.display = viewId === 'temporal' ? 'block' : 'none';
        if (focusBtn) focusBtn.style.display = viewId === 'kg'       ? 'block' : 'none';

        if (!initializedViews.has(viewId)) {
            initializedViews.add(viewId);
            setTimeout(() => viewInitializers[viewId]?.(), 60);
        }
    };

    const bindTabs = () => {
        document.querySelectorAll('.nav-tab').forEach(btn => {
            btn.addEventListener('click', () => switchTo(btn.dataset.view));
        });
        document.getElementById('reset-zoom')?.addEventListener('click', () => {
            LayoutLogic?.resetZoom?.();
        });
    };

    const boot = (data, kg) => {
        sharedData = data;
        sharedKG   = kg;
        initializedViews.add('kg');
        viewInitializers.kg();
    };

    return { bindTabs, boot, switchTo };
})();


// ── App Bootstrap ─────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    const overlay = document.getElementById('loading-overlay');

    ViewManager.bindTabs();

    DataParser.loadData()
        .then(data => {
            const loadingText = document.querySelector('.loading-text');
            if (loadingText) loadingText.textContent = 'Building Knowledge Graph…';

            const kg = KGBuilder.build(data);

            overlay.classList.add('hidden');
            setTimeout(() => { overlay.style.display = 'none'; }, 500);

            ViewManager.boot(data, kg);
        })
        .catch(err => {
            console.error('[Dark Series] Failed to load:', err);
            overlay.innerHTML = `
                <div class="loading-inner">
                    <p style="color:#ef4444;font-size:15px;text-align:center;padding:20px;max-width:520px;line-height:1.7">
                        ⚠️ Failed to load data files.<br>
                        <span style="font-size:12px;color:var(--text-muted)">
                            ${err.message}<br><br>
                            Make sure the server is running at
                            <strong>http://127.0.0.1:3000</strong>
                        </span>
                    </p>
                </div>`;
        });
});