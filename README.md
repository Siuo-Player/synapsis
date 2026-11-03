# 🌌 Synapsis 3.1.1 • Grafo Pedagógico de Inteligência Artificial & Machine Learning

[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Live%20Demo-brightgreen?logo=github)](https://siuo-player.github.io/synapsis/)
[![CI](https://github.com/Siuo-Player/synapsis/actions/workflows/validate.yml/badge.svg)](https://github.com/Siuo-Player/synapsis/actions)
[![AI Ready](https://img.shields.io/badge/AI%20Standard-llms.txt-blue?logo=openai)](https://siuo-player.github.io/synapsis/llms.txt)
[![JSON Schema](https://img.shields.io/badge/Schema-Draft--07%20Validated-orange?logo=json)](https://siuo-player.github.io/synapsis/synapsis_schema.json)
[![Graph Nodes](https://img.shields.io/badge/Knowledge%20Nodes-60%20Concepts%20(AI%20%26%20ML)-purple)](#)
[![Integrity Test](https://img.shields.io/badge/Test%20Suite-13%2F13%20Passed%20100%25-success)](#)
[![License](https://img.shields.io/badge/License-MIT-gray)](./LICENSE)

> **Plataforma Pedagógica Interativa de Estudo, Visualização de Grafos Acíclicos Dirigidos (DAG) e Ontologia para Modelos de Linguagem em Inteligência Artificial.**  
> *Projeto de estudo individual autónomo desenvolvido em colaboração com múltiplos assistentes de IA, focado estritamente na modelação de conteúdos científicos e nas relações formativas entre eles.*

---

## 🎯 Sobre o Synapsis

O **Synapsis** estrutura os conhecimentos de Inteligência Artificial e Aprendizagem Computacional como uma **rede navegável de pré-requisitos formativos**: cada conceito de Machine Learning ou Deep Learning apoia-se em fundamentos matemáticos e algoritmos que devem ser compreendidos previamente.

- **🪐 Modo Órbita Radial:** Visualização em 6 anéis concêntricos (Níveis 0 a 5) calculados estritamente pela profundidade topológica do DAG. O layout visual cósmico é inspirado esteticamente na disposição radial do projeto Axiom; a ontologia conceptual, taxonomia de IA e relações pedagógicas de dependência são originais e exclusivas do Synapsis.
- **📦 Modo Caixas:** Hierarquia topológica em fluxo ortogonal da esquerda para a direita.
- **🕸️ Modo Orgânico:** Exploração dinâmica com forças gravitacionais e molas de atração.
- **⚡ 7 Simuladores Matemáticos Dedicados:**
  1. *Entropia de Shannon, Ganho de Informação (ID3), Gain Ratio (C4.5) e Redução de Gini (CART)* (com cálculo analítico rigoroso via módulo `simulator_math.js`, garantia de conservação $w_L p_L + (1-w_L) p_R = p$ e zero resultados `NaN` em partições puras).
  2. *Métricas de Distância em Espaços Normados $L_p$* (Manhattan $L_1$, Euclidiana $L_2$, Chebyshev $L_\infty$).
  3. *Matriz de Confusão & Métricas Diagnósticas* (Precision, Recall, Specificity, F1-Score, Balanced Accuracy).
  4. *Funções de Ativação Neurais & Vanishing Gradient* (Sigmóide, ReLU, LeakyReLU, Tanh e derivadas analíticas).
  5. *Inferência Bayesiana & A Falácia da Taxa Base* (Prior, Verossimilhança, Evidência e Teorema de Bayes).
  6. *Descida de Gradiente & Estabilidade de Lipschitz* (Taxa $\eta < 2/L$, convergência monótona, oscilação amortecida e divergência catastrófica).
  7. *Margem Máxima em SVM* (Hiperplano ótimo, norma $\|w\| = 2/\gamma$ e regularização $C$).
- **🧭 Trilha de Estudo (Algoritmo de Kahn):** Ordenação topológica estrita de pré-requisitos para cada um dos 60 nós, com acompanhamento de progresso em `localStorage` e exportação de progresso em JSON.
- **📱 Design Responsivo:** Drawer lateral com recolhimento total no desktop (o canvas expande a 100%) e bottom-sheet nativo em dispositivos móveis e tablets.
- **🔍 Pesquisa Acentuada & Autocomplete:** Normalização Unicode (`NFD`) com pesquisa multi-campo segura.
- **🤖 Integração Rigorosa com IA:** 
  - `llms.txt`: Especificação padronizada para agentes de IA com instruções de travessia topológica e aviso epistemológico.
  - `synapsis_graph.json`: Exportação completa em formato de grafo validada por Schema JSON Draft-07.
  - Prompts Socráticos e Contexto 1-Click para ChatGPT, Claude e Gemini.

---

## 🚀 Acesso Imediato

- **🌐 Versão Online (GitHub Pages):** [https://siuo-player.github.io/synapsis/](https://siuo-player.github.io/synapsis/)
- **🤖 Grafo em JSON para IAs:** [`synapsis_graph.json`](https://siuo-player.github.io/synapsis/synapsis_graph.json)
- **📋 JSON Schema Draft-07:** [`synapsis_schema.json`](https://siuo-player.github.io/synapsis/synapsis_schema.json)
- **📄 Especificação para LLMs:** [`llms.txt`](https://siuo-player.github.io/synapsis/llms.txt)
- **⚖️ Avisos de Terceiros e Licenças:** [`THIRD_PARTY_NOTICES.md`](https://siuo-player.github.io/synapsis/THIRD_PARTY_NOTICES.md)

---

## 📚 Domínios Científicos Cobertos

1. **Fundamentos Matemáticos (`foundations` - 11 conceitos):** Álgebra Linear Espectral, Cálculo Multivariável e Matrizes Hessianas, Espaços Métricos $L_p$, Teoria das Probabilidades e Distribuições, Otimização Convexa (Condições KKT), Teoria da Informação de Shannon e Teoria da Aprendizagem Estatística (Dimensão VC).
2. **Aprendizagem Computacional (`academic_ml` - 38 conceitos):** Árvores de Decisão (ID3, C4.5, CART e Poda), Métodos Baseados em Instâncias (k-NN), Classificadores Naive Bayes, Regressão Logística, SVM Linear e com Kernel, Perceptrões e MLPs, Clustering (K-Means, GMM/EM), Ensembles (AdaBoost, Random Forests, Gradient Boosting) e Métricas de Avaliação Diagnóstica.
3. **Inteligência Artificial Integrada (`masters_ai` - 11 conceitos):** Paradigma Simbólico vs Conexionista, Algoritmos Genéticos, Otimização por Enxame de Partículas (PSO), Processos de Decisão de Markov (MDP), Aprendizagem por Reforço (Q-Learning), Mecanismos de Atenção e Transformers, e Modelos Generativos Profundos (Variational Autoencoders e Modelos de Difusão).

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
   - Validade, ausência de duplicados e completude da ordenação de Kahn em todas as 60 cadeias ancestrais.
   - Presença e tipagem explícita de todos os 15 simuladores.
   - Sincronização profunda campo a campo entre `concepts.js` e `synapsis_graph.json`.
   - Completude da documentação em `llms.txt` para todos os 60 conceitos.
   - Validação formal obrigatória Draft-07 JSON Schema.
   - Verificação local de todas as 60 fontes KaTeX (`.woff2`, `.woff`, `.ttf`) com verificação de assinaturas binárias (magic bytes).
   - Execução dos testes unitários JavaScript (`test_simulator_math.js`) com 1.615 configurações testadas com zero erros `NaN`.

---

## 📄 Autoria e Licença
- **Natureza do Projeto:** Estudo individual autónomo em Inteligência Artificial, desenvolvido com apoio de múltiplos assistentes de IA (LLMs) para organização e visualização do conhecimento.
- **Licença:** Distribuído sob licença MIT. Consulte [`LICENSE`](./LICENSE) para mais informações.
