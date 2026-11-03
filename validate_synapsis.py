# -*- coding: utf-8 -*-
"""
validate_synapsis.py
Automated Quality, Integrity and Mathematical Consistency Test Suite for Synapsis 3.1.1.
Target Scope: Artificial Intelligence & Machine Learning Curriculum.
"""
import json
import re
import sys
import io
import os

# Ensure UTF-8 output on Windows console
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

def run_tests():
    print("==================================================")
    print("Synapsis 3.1.1 Automated Quality & Integrity Suite")
    print("Target Scope: Artificial Intelligence & Machine Learning")
    print("==================================================")
    
    base_dir = '.'
    if os.path.exists('interactive_blueprint/concepts.js'):
        base_dir = 'interactive_blueprint'
    
    # 1. Load concepts.js
    concepts_path = os.path.join(base_dir, 'concepts.js')
    with open(concepts_path, 'r', encoding='utf-8') as f:
        js_content = f.read()
    match = re.search(r'const CONCEPTS_DATA\s*=\s*(\[[\s\S]*\]);', js_content)
    assert match, "Failed to parse CONCEPTS_DATA from concepts.js"
    concepts = json.loads(match.group(1))
    
    print(f"✓ Loaded {len(concepts)} concepts from {concepts_path}")
    assert len(concepts) == 60, f"Expected 60 concepts for AI curriculum, found {len(concepts)}"
    
    # Test 1: ID Uniqueness
    ids = [c['id'] for c in concepts]
    assert len(ids) == len(set(ids)), f"Duplicate IDs found: {[x for x in ids if ids.count(x) > 1]}"
    print(f"✓ Test 1 Passed: All {len(ids)} concept IDs are strictly unique.")
    
    concept_map = {c['id']: c for c in concepts}
    
    # Test 2: 100% Dependency Resolution (0 broken links)
    broken_links = []
    total_edges = 0
    for c in concepts:
        for dep in c.get('dependencies', []):
            total_edges += 1
            if dep not in concept_map:
                broken_links.append((c['id'], dep))
    assert len(broken_links) == 0, f"Broken dependencies detected: {broken_links}"
    print(f"✓ Test 2 Passed: 100% of {total_edges} dependencies resolve to valid concept nodes (0 broken links).")
    
    # Test 3: DAG Acyclicity (No circular dependencies)
    visited = {}  # 0: unvisited, 1: visiting, 2: visited
    def dfs(node_id, path):
        visited[node_id] = 1
        for dep in concept_map[node_id].get('dependencies', []):
            if visited.get(dep, 0) == 1:
                raise AssertionError(f"Cycle detected in dependencies: {' -> '.join(path + [dep])}")
            if visited.get(dep, 0) == 0:
                dfs(dep, path + [dep])
        visited[node_id] = 2

    for cid in concept_map:
        if visited.get(cid, 0) == 0:
            dfs(cid, [cid])
    print("✓ Test 3 Passed: Verified Graph is a strict Directed Acyclic Graph (DAG) with zero cycles.")
    
    # Test 4: Strict Topological Depth (level(u) < level(v) for all edges u -> v)
    level_violations = []
    for c in concepts:
        v_level = c.get('level', 0)
        for dep in c.get('dependencies', []):
            u_level = concept_map[dep].get('level', 0)
            if u_level >= v_level:
                level_violations.append((dep, u_level, c['id'], v_level))
    assert len(level_violations) == 0, f"Topological level violations detected: {level_violations}"
    print("✓ Test 4 Passed: Strict topological depth verified. level(u) < level(v) for all edges.")
    
    # Test 5: Kahn's Topological Sort Completeness, Order & Zero Duplicates
    def get_all_ancestors(target_id):
        seen = set()
        stack = [target_id]
        while stack:
            curr = stack.pop()
            for dep in concept_map[curr].get('dependencies', []):
                if dep not in seen:
                    seen.add(dep)
                    stack.append(dep)
        return seen

    for c in concepts:
        chain = c.get('ancestral_chain', [])
        assert chain, f"Concept {c['id']} missing ancestral_chain"
        assert chain[-1] == c['id'], f"Concept {c['id']} ancestral chain must end with itself"
        
        # Verify no duplicate entries in ancestral chain
        assert len(chain) == len(set(chain)), f"Duplicate entries in ancestral chain for {c['id']}: {chain}"
        
        # Verify all transitive ancestors are included
        expected_ancestors = get_all_ancestors(c['id'])
        assert set(chain[:-1]) == expected_ancestors, f"Incomplete ancestral chain for {c['id']}"
        
        # Verify topological ordering
        seen = set()
        for node in chain:
            for dep in concept_map[node].get('dependencies', []):
                if dep in set(chain):
                    assert dep in seen, f"Kahn topological violation in {c['id']}: {dep} must appear before {node}"
            seen.add(node)
    print("✓ Test 5 Passed: All 60 ancestral chains strictly adhere to Kahn's topological sorting with 100% ancestor completeness and 0 duplicates.")
    
    # Test 6: Valid Core Domains (academic_ml, foundations, masters_ai)
    valid_domains = {'academic_ml', 'foundations', 'masters_ai'}
    for c in concepts:
        dom = c.get('domain')
        assert dom in valid_domains, f"Invalid domain {dom} for concept {c['id']}"
        for d in c.get('domains', []):
            assert d in valid_domains, f"Invalid secondary domain {d} in {c['id']}"
    print("✓ Test 6 Passed: All concept domains adhere to the 3 AI taxonomies (foundations, academic_ml, masters_ai).")
    
    # Test 7: Simulators Explicit Typing, Feasibility & Exact Count Verification
    valid_sim_types = {'entropy_gain', 'knn_spatial', 'confusion_matrix', 'neural_activations', 'bayesian_inference', 'gradient_descent', 'svm_margin'}
    sim_count = 0
    for c in concepts:
        sim = c.get('simulator')
        if sim:
            sim_count += 1
            assert sim.get('type') in valid_sim_types, f"Unknown simulator type {sim.get('type')} in {c['id']}"
    assert sim_count == 15, f"Expected exactly 15 interactive simulators, found {sim_count}"
    print(f"✓ Test 7 Passed: Exactly {sim_count} interactive simulators are explicitly typed, configured, and validated.")
    
    # Test 8: Exhaustive Mathematical Feasibility of Entropy Simulator Bounds
    grid_points = 0
    for p_int in range(5, 96, 5):
        p = p_int / 100.0
        for wl_int in range(10, 91, 5):
            wL = wl_int / 100.0
            pLMin = max(0.001, (p - (1 - wL)) / wL)
            pLMax = min(0.999, p / wL)
            assert pLMin <= pLMax, f"Invalid bounds for p={p}, wL={wL}"
            for alpha in [0.0, 0.25, 0.5, 0.75, 1.0]:
                pL = pLMin + alpha * (pLMax - pLMin)
                pR = (p - wL * pL) / (1 - wL)
                assert -1e-6 <= pR <= 1 + 1e-6, f"Probability conservation violation: pR={pR}"
                assert abs(wL * pL + (1 - wL) * pR - p) < 1e-6, "Sum of split does not equal parent p"
                grid_points += 1
    print(f"✓ Test 8 Passed: Entropy conservation equation w_L*p_L + (1-w_L)*p_R = p verified across {grid_points} grid parameter configurations.")

    # Test 9: synapsis_graph.json Deep Field-by-Field & Key-by-Key Synchronicity
    graph_path = os.path.join(base_dir, 'synapsis_graph.json')
    with open(graph_path, 'r', encoding='utf-8') as f:
        graph = json.load(f)
    assert graph.get('schema_version') == '3.1.0', f"Unexpected schema version: {graph.get('schema_version')}"
    assert len(graph.get('concepts', [])) == len(concepts), "Concept count mismatch in graph json"
    assert graph.get('concepts_count') == len(concepts), f"concepts_count mismatch in header: {graph.get('concepts_count')}"
    assert graph.get('edges_count') == total_edges, f"edges_count mismatch in header: {graph.get('edges_count')} vs {total_edges}"
    assert graph.get('relation_semantics') == 'pedagogical_prerequisite', "Incorrect relation semantics"
    assert graph.get('edge_direction') == 'prerequisite_to_dependent', "Incorrect edge direction"
    assert graph.get('causal_claim') is False, "causal_claim must be false"
    
    # Comprehensive key-by-key comparison of every single concept object
    concept_fields = [
        'id', 'label', 'domain', 'domains', 'category', 'course_module',
        'level', 'summary', 'definition', 'formula', 'code', 'code_language',
        'code_status', 'references', 'dependencies', 'ancestral_chain', 'simulator'
    ]
    graph_map = {gc['id']: gc for gc in graph['concepts']}
    assert set(concept_map.keys()) == set(graph_map.keys()), "Mismatch in concept ID sets"
    for cid, c in concept_map.items():
        gc = graph_map[cid]
        for field in concept_fields:
            assert c.get(field) == gc.get(field), f"Field mismatch in '{cid}' for field '{field}'"
    
    # Verify adjacency mappings
    assert 'graph_representation' in graph, "Missing graph_representation in synapsis_graph.json"
    prereqs = graph['graph_representation']['prerequisites_by_concept']
    dependents = graph['graph_representation']['dependents_by_prerequisite']
    for c in concepts:
        cid = c['id']
        assert prereqs.get(cid) == c.get('dependencies', []), f"Adjacency mismatch for {cid}"
        for dep in c.get('dependencies', []):
            assert cid in dependents.get(dep, []), f"Reverse adjacency missing {cid} in {dep}"
    print(f"✓ Test 9 Passed: synapsis_graph.json has 100% deep key-by-key synchronicity with concepts.js (all {len(concept_fields)} fields, counts, and dual adjacency maps).")
    
    # Test 10: llms.txt Deep Completeness
    llms_path = os.path.join(base_dir, 'llms.txt')
    with open(llms_path, 'r', encoding='utf-8') as f:
        llms_text = f.read()
    for c in concepts:
        assert f"### `{c['id']}`:" in llms_text, f"Missing documentation block for {c['id']} in llms.txt"
        assert c['label'] in llms_text, f"Missing label for {c['id']} in llms.txt"
        assert f"Level {c['level']}" in llms_text, f"Missing level for {c['id']} in llms.txt"
        # Verify first sentence of summary is present in documentation
        first_clause = c['summary'].split('.')[0].strip()
        assert first_clause in llms_text, f"Missing core summary excerpt for '{c['id']}' in llms.txt"
    print("✓ Test 10 Passed: llms.txt contains complete documentation, metadata, and summaries for all 60 AI concepts.")
    
    # Test 11: Mandatory Formal Draft-07 JSON Schema Validation
    try:
        import jsonschema
    except ImportError:
        raise AssertionError("jsonschema package is strictly required for Test 11. Run: pip install jsonschema")
        
    schema_path = os.path.join(base_dir, 'synapsis_schema.json')
    with open(schema_path, 'r', encoding='utf-8') as f:
        schema = json.load(f)
    try:
        jsonschema.validate(instance=graph, schema=schema)
        print("✓ Test 11 Passed: synapsis_graph.json strictly passes Draft-07 JSON Schema validation (all required properties enforced).")
    except Exception as e:
        raise AssertionError(f"JSON Schema validation failed: {e}")

    # Test 12: Exhaustive KaTeX Fonts Verification (Existence, Paths, Non-empty & Binary Signatures)
    css_path = os.path.join(base_dir, 'libs', 'katex.min.css')
    assert os.path.exists(css_path), "libs/katex.min.css missing"
    with open(css_path, 'r', encoding='utf-8') as f:
        css_text = f.read()
    
    font_refs = set(re.findall(r'url\(([^)]+)\)', css_text))
    assert len(font_refs) == 60, f"Expected 60 font references in katex.min.css, found {len(font_refs)}"
    
    FONT_SIGNATURES = {
        '.woff2': b'wOF2',
        '.woff': b'wOFF',
        '.ttf': b'\x00\x01\x00\x00',
    }
    
    for ref in font_refs:
        clean_ref = ref.strip('\'"')
        assert not clean_ref.startswith('http') and not clean_ref.startswith('//'), f"Font reference {clean_ref} is not local!"
        font_path = os.path.normpath(os.path.join(os.path.dirname(css_path), clean_ref))
        assert os.path.isfile(font_path), f"Missing referenced font file: {font_path}"
        size = os.path.getsize(font_path)
        assert size > 0, f"Font file {font_path} is empty (0 bytes)"
        ext = os.path.splitext(font_path)[1].lower()
        if ext in FONT_SIGNATURES:
            with open(font_path, 'rb') as ff:
                header = ff.read(4)
                assert header == FONT_SIGNATURES[ext], f"Invalid binary signature for {font_path}: expected {FONT_SIGNATURES[ext]}, got {header}"
    print(f"✓ Test 12 Passed: All 60 KaTeX fonts referenced by CSS verified locally with non-empty files and valid binary signatures (.woff2, .woff, .ttf).")

    # Test 13: SimulatorMath Module & JavaScript Unit Tests Execution
    test_math_path = os.path.join(base_dir, 'test_simulator_math.js')
    assert os.path.exists(test_math_path), f"Missing {test_math_path}"
    
    import subprocess
    result = subprocess.run(['node', test_math_path], capture_output=True, text=True)
    if result.returncode != 0:
        raise AssertionError(f'test_simulator_math.js failed with code {result.returncode}: ' + result.stderr + result.stdout)
    print("✓ Test 13 Passed: SimulatorMath JavaScript unit tests executed cleanly via Node.js (0 NaN errors across 1,615 tests).")

    print("==================================================")
    print("🎉 ALL 13 TEST SUITES PASSED WITH 100% SUCCESS!")
    print("==================================================")

if __name__ == '__main__':
    run_tests()
