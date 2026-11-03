# 🌌 Synapsis 3.2.0 • Grafo Pedagógico de Inteligência Artificial & Machine Learning

[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Live%20Demo-brightgreen?logo=github)](https://siuo-player.github.io/synapsis/)
[![CI](https://github.com/Siuo-Player/synapsis/actions/workflows/validate.yml/badge.svg)](https://github.com/Siuo-Player/synapsis/actions)
[![AI Ready](https://img.shields.io/badge/AI%20Standard-llms.txt-blue?logo=openai)](https://siuo-player.github.io/synapsis/llms.txt)
[![JSON Schema](https://img.shields.io/badge/Schema-Draft--07%20Validated-orange?logo=json)](https://siuo-player.github.io/synapsis/synapsis_schema.json)
[![Graph Nodes](https://img.shields.io/badge/Knowledge%20Nodes-64%20Concepts%20(AI%20%26%20ML)-purple)](#)
[![Integrity Test](https://img.shields.io/badge/Test%20Suite-13%2F13%20Passed%20100%25-success)](#)
[![License](https://img.shields.io/badge/License-MIT-gray)](./LICENSE)

> **Plataforma Pedagógica Interativa de Estudo, Visualização de Grafos Acíclicos Dirigidos (DAG) e Ontologia Epistemológica para Modelos de Linguagem em Inteligência Artificial.**  
> *Projeto de estudo individual autónomo desenvolvido em colaboração com múltiplos assistentes de IA, focado estritamente na modelação de conteúdos científicos e nas relações formativas entre eles.*

---

## 🎯 Sobre o Synapsis

O **Synapsis** estrutura os conhecimentos de Inteligência Artificial e Aprendizagem Computacional como uma **rede navegável de pré-requisitos formativos**: cada conceito de Machine Learning ou Deep Learning apoia-se em fundamentos matemáticos e algoritmos que devem ser compreendidos previamente.

### 🌲 A Arquitetura em Árvore Dedutiva Axiomática

O Synapsis implementa uma rigorosa **estratificação epistemológica**: o conhecimento flui estritamente de cima para baixo a partir de axiomas fundamentais:

$$\operatorname{nível}(v) = \begin{cases} 0, & \text{se } \operatorname{Premissas}(v) = \emptyset \quad (\text{Axiomas Primitivos no Topo}) \\ 1 + \max_{u \in \operatorname{Premissas}(v)} \operatorname{nível}(u), & \text{caso contrário} \end{cases}$$

1. **Raízes Axiomáticas no Topo ($L = 0$):** O topo absoluto da árvore é composto exclusivamente pelos fundamentos puros indecomponíveis: Cálculo Multivariável, Álgebra Linear Espectral, Teoria da Probabilidade de Kolmogorov, Otimização Convexa, Lógica Indutiva, Teoria da Complexidade e Teoria dos Grafos.
2. **Regra de Elevação Dedutiva:** Uma conclusão assenta sobre várias premissas e situa-se **rigorosamente um estrato acima da premissa mais avançada de que necessita**. Nenhuma conclusão flutua no vazio e nenhum conceito pode anteceder as suas bases lógicas.
3. **Cadeia Crítica Epistemológica ($L_{\max}$):** A altura máxima da árvore é determinada pelo comprimento do caminho dedutivo mais longo ($\text{Axioma} \to \text{Premissa} \dots \to \text{Aplicação Terminal}$).
4. **Construção Dual:**
   - *De Baixo para Cima (Bottom-Up):* Síntese e progressão formativa natural a partir dos pilares matemáticos já consolidados.
   - *De Cima para Baixo (Top-Down):* Decomposição analítica rigorosa: quando uma técnica prática requer fundações adicionais, desce-se recursivamente através de cada elo pré-requisito até ancorar nos axiomas primitivos indecomponíveis.

---

## 🪐 Modos de Visualização

- **🌲 Árvore Dedutiva (Top-Down):** Visualização hierárquica vertical com raízes axiomáticas no topo e derivação contínua em estratos horizontais sucessivos ($L=0$ a $L=5$).
- **🪐 Órbita Radial:** Visualização em anéis concêntricos calculados estritamente pela profundidade topológica do DAG.
- **📦 Níveis Horizontais:** Hierarquia topológica em fluxo ortogonal da esquerda para a direita.
- **🕸️ Modo Orgânico:** Exploração dinâmica com forças gravitacionais e molas de atração.

---

## ⚡ 16 Simuladores Matemáticos Dedicados

1. *Entropia de Shannon, Ganho de Informação (ID3), Gain Ratio (C4.5) e Redução de Gini (CART)* (com cálculo analítico rigoroso via módulo `simulator_math.js`, garantia de conservação $w_L p_L + (1-w_L) p_R = p$ e zero resultados `NaN` em partições puras).
2. *Métricas de Distância em Espaços Normados $L_p$* (Manhattan $L_1$, Euclidiana $L_2$, Chebyshev $L_\infty$).
3. *Matriz de Confusão & Métricas Diagnósticas* (Precision, Recall, Specificity, F1-Score, Balanced Accuracy).
4. *Funções de Ativação Neurais & Vanishing Gradient* (Sigmóide, ReLU, LeakyReLU, Tanh e derivadas analíticas).
5. *Inferência Bayesiana & A Falácia da Taxa Base* (Prior, Verossimilhança, Evidência e Teorema de Bayes).
6. *Descida de Gradiente & Estabilidade de Lipschitz* (Taxa $\eta < 2/L$, convergência monótona, oscilação amortecida e convergência para a solução analítica OLS).
7. *Margem Máxima em SVM* (Hiperplano ótimo, norma $\|w\| = 2/\gamma$ e regularização $C$).

---

## 📚 Domínios Científicos Cobertos (64 Conceitos)

1. **Fundamentos Matemáticos (`foundations` - 12 conceitos):** Álgebra Linear Espectral, Cálculo Multivariável e Matrizes Hessianas, Espaços Métricos $L_p$, Teoria das Probabilidades de Kolmogorov, Otimização Convexa (Condições KKT), Teoria da Informação de Shannon, Pressupostos de Gauss-Markov e Teoria da Aprendizagem Estatística (Dimensão VC).
2. **Aprendizagem Computacional (`academic_ml` - 41 conceitos):** Regressão Linear & OLS (Equações Normais e Decomposição da Variância), Regressão Logística, Métricas de Regressão & Análise de Resíduos ($R^2$, MSE, RMSE, MAE), Árvores de Decisão (ID3, C4.5, CART e Poda), Métodos Baseados em Instâncias (k-NN e Maldição da Dimensionalidade), Classificadores Naive Bayes (MAP, Log-Likelihood e Suavização de Laplace), SVM Linear e com Kernel, Perceptrões e MLPs, Clustering (K-Means, GMM/EM), Ensembles (AdaBoost, Random Forests, Gradient Boosting) e Normalização Z-score com Prevenção de Data Leakage.
3. **Inteligência Artificial Integrada (`masters_ai` - 11 conceitos):** Paradigma Simbólico vs Conexionista, Algoritmos Genéticos, Otimização por Enxame de Partículas (PSO), Processos de Decisão de Markov (MDP), Aprendizagem por Reforço (Q-Learning), Mecanismos de Atenção e Transformers, e Modelos Generativos Profundos (Variational Autoencoders e Modelos de Difusão).

---

## 🚀 Acesso Imediato

- **🌐 Versão Online (GitHub Pages):** [https://siuo-player.github.io/synapsis/](https://siuo-player.github.io/synapsis/)
- **🤖 Grafo em JSON para IAs:** [`synapsis_graph.json`](https://siuo-player.github.io/synapsis/synapsis_graph.json)
- **📋 JSON Schema Draft-07:** [`synapsis_schema.json`](https://siuo-player.github.io/synapsis/synapsis_schema.json)
- **📄 Especificação para LLMs:** [`llms.txt`](https://siuo-player.github.io/synapsis/llms.txt)
- **⚖️ Avisos de Terceiros e Licenças:** [`THIRD_PARTY_NOTICES.md`](https://siuo-player.github.io/synapsis/THIRD_PARTY_NOTICES.md)

---

## 🛠️ Executar Localmente & Testes Automatizados

Como todas as bibliotecas (`vis-network`, `KaTeX`) estão embutidas na pasta `libs/`, a aplicação funciona completamente offline sem servidores externos:

1. **Clonar o Repositório:**
   ```bash
   git clone https://github.com/Siuo-Player/synapsis.git
   cd synapsis
   ```

2. **Abrir a Aplicação:**
   Basta abrir `index.html` em qualquer navegador moderno.

3. **Executar a Suíte de Qualidade & Integridade Completa (13/13 testes):**
   ```bash
   pip install jsonschema
   python validate_synapsis.py
   ```
   Valida automaticamente:
   - 0 ciclos (DAG comprovado).
   - 100% de dependências resolvidas (0 links quebrados).
   - Conformidade estrita dos níveis topológicos ($\text{level}(u) < \text{level}(v)$).
   - Validade, ausência de duplicados e completude da ordenação de Kahn em todas as 64 cadeias ancestrais.
   - Presença e tipagem explícita de todos os 16 simuladores.
   - Sincronização profunda campo a campo entre `concepts.js` e `synapsis_graph.json`.
   - Completude da documentação em `llms.txt` para todos os 64 conceitos.
   - Validação formal obrigatória Draft-07 JSON Schema.
   - Verificação local de todas as 60 fontes KaTeX (`.woff2`, `.woff`, `.ttf`) com verificação de assinaturas binárias (magic bytes).
   - Execução dos testes unitários JavaScript (`test_simulator_math.js`) com 1.615 configurações testadas com zero erros `NaN`.

4. **Executar Testes de Integração de Navegador (Playwright):**
   ```bash
   pip install playwright
   python test_browser_ui.py
   ```

---

## 📄 Autoria e Licença
- **Natureza do Projeto:** Estudo individual autónomo em Inteligência Artificial, desenvolvido com apoio de múltiplos assistentes de IA (LLMs) para organização e visualização do conhecimento.
- **Licença:** Distribuído sob licença MIT. Consulte [`LICENSE`](./LICENSE) para mais informações.
