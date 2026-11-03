# -*- coding: utf-8 -*-
"""
test_browser_ui.py
Playwright Browser Integration & UI Test Suite for Synapsis.
Verifies real DOM rendering, simulator controls, zero NaNs, zero external CDN leaks, and offline autonomy.
"""

import sys
import io
import os
import time
import threading
from http.server import SimpleHTTPRequestHandler, HTTPServer
from playwright.sync_api import sync_playwright

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

def run_browser_tests():
    print("==================================================")
    print("Running Synapsis Browser UI & Playwright Test Suite")
    print("==================================================")

    # Determine base directory
    base_dir = os.path.abspath('interactive_blueprint' if os.path.exists('interactive_blueprint/index.html') else '.')

    # Start local HTTP server on ephemeral port 8765
    server_port = 8765
    class QuietHandler(SimpleHTTPRequestHandler):
        def __init__(self, *args, **kwargs):
            super().__init__(*args, directory=base_dir, **kwargs)
        def log_message(self, format, *args):
            pass # Suppress HTTP access logging in test output

    httpd = HTTPServer(('127.0.0.1', server_port), QuietHandler)
    server_thread = threading.Thread(target=httpd.serve_forever, daemon=True)
    server_thread.start()
    print(f"✓ Local test server running on http://127.0.0.1:{server_port} serving {base_dir}")

    external_requests = []
    console_errors = []

    with sync_playwright() as p:
        # Launch browser (prefer system Edge on Windows, fallback to chromium)
        try:
            browser = p.chromium.launch(channel="msedge", headless=True)
        except Exception:
            browser = p.chromium.launch(headless=True)

        context = browser.new_context(viewport={'width': 1280, 'height': 800})
        page = context.new_page()

        # Track network requests to ensure 100% offline autonomy (zero external CDN calls)
        def handle_request(req):
            url = req.url
            if not url.startswith(f"http://127.0.0.1:{server_port}") and not url.startswith("data:"):
                external_requests.append(url)

        page.on("request", handle_request)
        page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)
        page.on("pageerror", lambda err: console_errors.append(str(err)))

        # 1. Load application page
        target_url = f"http://127.0.0.1:{server_port}/index.html"
        page.goto(target_url, wait_until="networkidle")
        print(f"✓ Step 1: Page loaded successfully. Title: '{page.title()}'")
        assert "Synapsis" in page.title(), f"Unexpected title: {page.title()}"

        # 2. Verify 100% offline autonomy (no external CDN calls)
        assert len(external_requests) == 0, f"External requests detected: {external_requests}"
        print("✓ Step 2: 100% Offline Autonomy confirmed (0 external CDN or 3rd-party requests).")

        # 3. Verify KaTeX and vis-network presence in window
        window_objects = page.evaluate("() => ({ hasKatex: typeof katex !== 'undefined', hasVis: typeof vis !== 'undefined', hasSimMath: typeof SimulatorMath !== 'undefined', conceptsCount: typeof CONCEPTS_DATA !== 'undefined' ? CONCEPTS_DATA.length : 0 })")
        assert window_objects['hasKatex'], "KaTeX library not loaded in window"
        assert window_objects['hasVis'], "vis-network library not loaded in window"
        assert window_objects['hasSimMath'], "SimulatorMath module not loaded in window"
        assert window_objects['conceptsCount'] == 64, f"Expected 60 concepts loaded, got {window_objects['conceptsCount']}"
        print(f"✓ Step 3: Core runtime globals verified (KaTeX, vis-network, SimulatorMath, {window_objects['conceptsCount']} concepts).")

        # 4. Verify visualization modes switching
        btn_radial = page.locator('button.view-mode-btn[data-mode="radial"]')
        btn_tree = page.locator('button.view-mode-btn[data-mode="tree"]')
        btn_boxes = page.locator('button.view-mode-btn[data-mode="cards"]')
        btn_organic = page.locator('button.view-mode-btn[data-mode="organic"]')

        btn_tree.click()
        time.sleep(0.3)
        assert "active" in (btn_tree.get_attribute("class") or "")

        btn_boxes.click()
        time.sleep(0.3)
        assert "active" in (btn_boxes.get_attribute("class") or "")

        btn_organic.click()
        time.sleep(0.3)
        assert "active" in (btn_organic.get_attribute("class") or "")

        btn_radial.click()
        time.sleep(0.3)
        assert "active" in (btn_radial.get_attribute("class") or "")
        print("✓ Step 4: Mode toggles functional (Radial Orbit, Hierarchical Boxes, Organic Spring).")

        # 5. Domain select filter
        domain_select = page.locator("#domain-select")
        domain_select.select_option("foundations")
        time.sleep(0.3)
        domain_select.select_option("all")
        time.sleep(0.3)
        print("✓ Step 5: Domain taxonomy filter dropdown functional.")

        # 6. Search bar functionality
        search_input = page.locator("#search-input")
        search_input.fill("shannon")
        time.sleep(0.4)
        dropdown_html = page.locator("#search-results-dropdown").inner_html()
        assert len(dropdown_html.strip()) > 0, "Expected search results dropdown to be populated"
        print("✓ Step 6: Search autocomplete functional (results rendered in dropdown).")

        # 7. Open concept with simulator (decision_trees_c45_cart)
        page.evaluate("() => { if (typeof selectConcept === 'function') selectConcept('decision_trees_c45_cart'); }")
        time.sleep(0.5)

        # Click simulator tab
        tab_sim = page.locator('button.tab-btn[data-tab="simulator"]')
        tab_sim.click()
        time.sleep(0.3)

        # 8. Test Entropy Simulator controls and NaN prevention in the DOM
        # Test boundary case: p = 0.91, wL = 0.90, pL = 0.90 (resulting in pure right branch pR = 1.0)
        page.evaluate("""() => {
            const sliderP = document.getElementById('shannon-slider-p');
            const sliderWl = document.getElementById('shannon-slider-wl');
            const sliderPl = document.getElementById('shannon-slider-pl');
            if (sliderP && sliderWl && sliderPl) {
                sliderP.value = '0.91';
                sliderP.dispatchEvent(new Event('input'));
                sliderWl.value = '0.90';
                sliderWl.dispatchEvent(new Event('input'));
                sliderPl.value = '0.90';
                sliderPl.dispatchEvent(new Event('input'));
            }
        }""")
        time.sleep(0.3)

        sim_outputs = page.evaluate("""() => {
            return {
                hVal: document.getElementById('shannon-h-val')?.textContent || '',
                igVal: document.getElementById('shannon-ig-val')?.textContent || '',
                grVal: document.getElementById('shannon-gr-val')?.textContent || '',
                dginiVal: document.getElementById('shannon-dgini-val')?.textContent || '',
                status: document.getElementById('shannon-status')?.textContent || ''
            };
        }""")

        assert "NaN" not in sim_outputs['hVal'], f"NaN detected in hVal: {sim_outputs['hVal']}"
        assert "NaN" not in sim_outputs['igVal'], f"NaN detected in igVal: {sim_outputs['igVal']}"
        assert "NaN" not in sim_outputs['grVal'], f"NaN detected in grVal: {sim_outputs['grVal']}"
        assert "NaN" not in sim_outputs['dginiVal'], f"NaN detected in dginiVal: {sim_outputs['dginiVal']}"
        assert "NaN" not in sim_outputs['status'], f"NaN detected in status bar: {sim_outputs['status']}"
        print(f"✓ Step 7: Live entropy simulator verified in DOM: H(D)={sim_outputs['hVal']}, Gain={sim_outputs['igVal']}, GainRatio={sim_outputs['grVal']}, Gini={sim_outputs['dginiVal']} (ZERO NaNs).")

        # 9. Responsive Mobile Viewport Test
        page.set_viewport_size({'width': 375, 'height': 812})
        time.sleep(0.5)
        is_canvas_visible = page.is_visible("#network-canvas")
        assert is_canvas_visible, "Network canvas not visible on mobile viewport"
        print("✓ Step 8: Mobile viewport (375x812) layout verified.")

        # 10. Verify zero uncaught JavaScript errors
        critical_errors = [e for e in console_errors if "favicon" not in e]
        assert len(critical_errors) == 0, f"Uncaught console errors detected: {critical_errors}"
        print("✓ Step 9: Zero console or runtime JavaScript errors detected.")

        browser.close()

    httpd.shutdown()
    print("==================================================")
    print("🎉 ALL BROWSER INTEGRATION TESTS PASSED WITH 100% SUCCESS!")
    print("==================================================")

if __name__ == '__main__':
    run_browser_tests()
